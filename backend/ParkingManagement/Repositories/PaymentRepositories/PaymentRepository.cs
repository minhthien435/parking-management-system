using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Models;
using ParkingManagement.Data;
using ParkingManagement.Services.Helpers; 

using System.Linq;

using ParkingManagement.Services.EmailServices;

namespace ParkingManagement.Repositories
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public PaymentRepository(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        private async Task SendPaymentEmailNotificationAsync(string bookingId, string paymentMethod, string transactionId, decimal amountPaid)
        {
            try
            {
                var booking = await _context.Bookings
                    .Include(b => b.VehicleUser)
                    .Include(b => b.VehicleType)
                    .FirstOrDefaultAsync(b => b.BookingId == bookingId);

                if (booking != null && booking.VehicleUser != null && !string.IsNullOrWhiteSpace(booking.VehicleUser.Email))
                {
                    string userName = booking.VehicleUser.FullName ?? booking.VehicleUser.Username ?? "Quý khách";
                    string vehicleType = booking.VehicleType?.VehicleTypeName ?? (booking.VehicleTypeId == 2 ? "Ô tô" : "Xe máy");
                    string recipientEmail = booking.VehicleUser.Email;
                    string bkgId = booking.BookingId;
                    string plate = booking.LicensePlate;
                    DateTime arrival = booking.ExpectedArrival;
                    DateTime departure = booking.ExpiredAt ?? booking.ExpectedArrival.AddHours(2);

                    string htmlBody = EmailTemplateHelper.BuildPaymentSuccessEmailHtml(
                        userName, bkgId, plate, vehicleType, arrival, departure, amountPaid, paymentMethod, transactionId);

                    string subject = $"[eParking] Xác nhận thanh toán thành công - Đơn đặt chỗ #{bkgId}";
                    await _emailService.SendEmailAsync(recipientEmail, subject, htmlBody);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PaymentEmailNotification Error] {ex.Message}");
            }
        }

        public async Task<Booking?> GetBookingByIdAsync(string bookingId)
        {
            return await _context.Bookings
                .Include(b => b.VehicleType)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);
        }

        public async Task CreatePaymentAsync(Payment payment)
        {
            await _context.Payments.AddAsync(payment);
            await _context.SaveChangesAsync();
        }

        public async Task<decimal> GetBasePriceForVehicleTypeAsync(int vehicleTypeId)
        {
            var policy = await _context.PricingPolicies
                .Where(p => p.VehicleTypeId == vehicleTypeId)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefaultAsync();
            return policy?.BasePrice ?? (vehicleTypeId == 1 ? 5000m : 15000m);
        }

        public async Task UpdateBookingAndPaymentSuccessAsync(string paymentId, string transactionId, decimal amountPaid)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var payment = await _context.Payments.AsNoTracking()
                        .FirstOrDefaultAsync(p => p.PaymentId.ToLower() == paymentId.ToLower());
        
                    if (payment == null)
                    {
                        Console.WriteLine($"[UpdateBookingAndPaymentSuccessAsync] Không tìm thấy payment khớp paymentId={paymentId}.");
                        await transaction.RollbackAsync();
                        return;
                    }
        
                    var vnNow = ParkingCalculationHelper.VnNow;
                    decimal finalAmount = amountPaid > 0 ? amountPaid : payment.AmountDue;
        
                    // Chặn race condition ở cấp DB: UPDATE có điều kiện, atomic.
                    // Chỉ request nào "thắng" (affectedRows == 1) mới được xử lý tiếp + gửi mail.
                    int affectedRows = await _context.Database.ExecuteSqlInterpolatedAsync($@"
                        UPDATE `payment`
                        SET `STATUS` = 'SUCCESS',
                            `TRANSACTION_ID` = {transactionId},
                            `PAYMENT_TIME` = {vnNow},
                            `AMOUNT_PAID` = {finalAmount}
                        WHERE `PAYMENT_ID` = {payment.PaymentId} AND `STATUS` <> 'SUCCESS'");
        
                    if (affectedRows == 0)
                    {
                        Console.WriteLine($"[UpdateBookingAndPaymentSuccessAsync] Payment {payment.PaymentId} đã được xử lý bởi request khác. Bỏ qua.");
                        await transaction.RollbackAsync();
                        return;
                    }
        
                    if (!string.IsNullOrEmpty(payment.BookingId))
                    {
                        var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == payment.BookingId);
                        if (booking != null) booking.Status = "CONFIRMED";
                    }
        
                    if (!string.IsNullOrEmpty(payment.SessionId))
                    {
                        var session = await _context.ParkingSessions.FirstOrDefaultAsync(s => s.SessionId == payment.SessionId);
                        if (session != null)
                        {
                            session.PaymentStatus = "PAID";
                            session.TotalFee = finalAmount;
                        }
                    }
        
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
        
                    if (!string.IsNullOrEmpty(payment.BookingId))
                    {
                        await SendPaymentEmailNotificationAsync(payment.BookingId, payment.PaymentMethod ?? "PAYOS", transactionId, finalAmount);
                    }
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }

        public async Task<bool> ProcessMockPaymentConfirmationAsync(string bookingId, string paymentMethod, string userId, decimal amount)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var payment = await _context.Payments
                        .FirstOrDefaultAsync(p => p.BookingId == bookingId);

                    if (payment == null)
                    {
                        payment = new Payment
                        {
                            PaymentId = "pay_" + Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper(),
                            PaymentType = "BOOKING",
                            BookingId = bookingId,
                            AmountDue = amount,
                            AmountPaid = amount,
                            ChangeDue = 0,
                            PaymentMethod = paymentMethod.ToUpper(),
                            Status = "SUCCESS",
                            UserId = userId,
                            PaymentTime = ParkingCalculationHelper.VnNow,
                            TransactionId = "MOCK_" + paymentMethod.ToUpper() + "_" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()
                        };
                        await _context.Payments.AddAsync(payment);
                    }
                    else
                    {
                        payment.Status = "SUCCESS";
                        payment.PaymentMethod = paymentMethod.ToUpper();
                        payment.AmountPaid = amount;
                        payment.PaymentTime = ParkingCalculationHelper.VnNow;
                        payment.TransactionId = "MOCK_" + paymentMethod.ToUpper() + "_" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
                        _context.Payments.Update(payment);
                    }

                    var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId);
                    if (booking != null)
                    {
                        booking.Status = "CONFIRMED";
                        _context.Bookings.Update(booking);
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    await SendPaymentEmailNotificationAsync(bookingId, paymentMethod, payment.TransactionId ?? "MOCK_PAYMENT", amount);
                    return true;
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
        }

        public async Task<PricingPolicy?> GetActivePricingPolicyByVehicleTypeAsync(int vehicleTypeId)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            return await _context.PricingPolicies
                .Where(p => p.VehicleTypeId == vehicleTypeId && p.EffectiveDate <= today)
                .OrderByDescending(p => p.EffectiveDate)
                .FirstOrDefaultAsync();
        }
    }
}
