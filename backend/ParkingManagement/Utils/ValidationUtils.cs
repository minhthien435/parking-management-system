using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ParkingManagement.Data;

namespace ParkingManagement.Utils
{
    public static class ValidationUtils
    {
        public static bool IsValidEmail(string email)
        {
            if (string.IsNullOrEmpty(email)) return false;
            string emailPattern = @"^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com)$";
            return Regex.IsMatch(email, emailPattern, RegexOptions.IgnoreCase); // Cho phép 4 loại mai : Gmail, Outlook, Hotmail, yahoo
        }

        public static bool IsValidPhoneNumber(string phoneNumber)
        {
            if (string.IsNullOrEmpty(phoneNumber)) return false;
            string phonePattern = @"^(0[3|5|7|8|9])+([0-9]{8})$";               // Điện thoại có 10 chữ số và dùng cho Việt Nam
            return Regex.IsMatch(phoneNumber, phonePattern);
        }

        public static bool IsValidPassword(string password)
        {
            if (string.IsNullOrEmpty(password)) return false;
            string passwordPattern = @"^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"; //Cho phép chứa các ký tự đặc biệt như @, $, !, %, *, ?, & giống hệt React
            return Regex.IsMatch(password, passwordPattern);
        }

        public static bool IsValidUsername(string username)
        {
            if (string.IsNullOrEmpty(username)) return false;
            string usernamePattern = @"^[a-zA-Z0-9._-]{4,20}$";                 // Username tối thiểu 3 ký tự, chỉ chứa chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang
            return Regex.IsMatch(username, usernamePattern);
        }

        public static async Task ValidateVehicleTypeConsistencyAsync(AppDbContext context, string licensePlate, int vehicleTypeId)
        {
            if (string.IsNullOrEmpty(licensePlate)) return;

            var cleanPlate = licensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();

            // 1. Chỉ so sánh với các đơn đặt chỗ ĐANG HOẠT ĐỘNG (Bỏ qua hoàn toàn các đơn CANCELLED, EXPIRED, COMPLETED)
            var existingDifferentTypeBooking = await context.Bookings
                .FirstOrDefaultAsync(b => b.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanPlate 
                                          && b.Status != "CANCELLED"
                                          && b.Status != "EXPIRED"
                                          && b.Status != "COMPLETED"
                                          && b.VehicleTypeId != vehicleTypeId);

            if (existingDifferentTypeBooking != null)
            {
                var existingTypeName = existingDifferentTypeBooking.VehicleTypeId == 1 ? "Xe máy" : "Xe hơi";
                throw new InvalidOperationException($"Biển số xe này đang có một đơn đặt chỗ hoạt động với loại phương tiện là {existingTypeName}. Vui lòng kiểm tra lại loại xe hoặc biển số.");
            }

            // 2. Kiểm tra nếu xe đang thực sự gửi ở trong bãi (ParkingSession status = ACTIVE)
            var activeSession = await context.ParkingSessions
                .FirstOrDefaultAsync(ps => ps.LicensePlateIn.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanPlate
                                          && ps.Status == "ACTIVE"
                                          && ps.VehicleTypeId != vehicleTypeId);

            if (activeSession != null)
            {
                var activeTypeName = activeSession.VehicleTypeId == 1 ? "Xe máy" : "Xe hơi";
                throw new InvalidOperationException($"Xe mang biển số này đang đỗ trong bãi với loại phương tiện là {activeTypeName}. Vui lòng kiểm tra lại.");
            }
        }
    }
}

