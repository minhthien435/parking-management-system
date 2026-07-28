using System;

namespace ParkingManagement.Services.Helpers
{
    public static class EmailTemplateHelper
    {
        public static string BuildPaymentSuccessEmailHtml(
            string userName,
            string bookingId,
            string licensePlate,
            string vehicleTypeName,
            DateTime expectedArrival,
            DateTime expiredAt,
            decimal amountPaid,
            string paymentMethod,
            string transactionId)
        {
            string arrivalStr = expectedArrival.ToString("dd/MM/yyyy HH:mm");
            string expiredStr = expiredAt.ToString("dd/MM/yyyy HH:mm");
            string expiredTimeStr = expiredAt.ToString("HH:mm dd/MM/yyyy");
            string amountStr = amountPaid.ToString("N0");

            return @"<!DOCTYPE html>
<html lang=""vi"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Xác nhận thanh toán đặt chỗ bãi xe</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b;"">
    <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" style=""background-color: #f4f6f8; padding: 30px 0;"">
        <tr>
            <td align=""center"">
                <table role=""presentation"" width=""600"" cellspacing=""0"" cellpadding=""0"" style=""background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);"">
                    <!-- Header -->
                    <tr>
                        <td style=""background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center;"">
                            <h1 style=""color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;"">eParking System</h1>
                            <p style=""color: #ecfdf5; margin: 8px 0 0 0; font-size: 15px;"">Xác nhận đơn đặt chỗ &amp; Thanh toán thành công</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style=""padding: 35px 30px;"">
                            <p style=""font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;"">
                                Kính gửi <strong>" + userName + @"</strong>,
                            </p>
                            <p style=""font-size: 15px; margin: 0 0 25px 0; line-height: 1.6; color: #475569;"">
                                Cảm ơn Quý khách đã sử dụng dịch vụ của hệ thống <strong>eParking</strong>. Đơn đặt chỗ gửi xe của Quý khách đã được xác nhận thanh toán thành công với các thông tin chi tiết dưới đây:
                            </p>

                            <!-- Receipt Card -->
                            <div style=""background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px;"">
                                <table width=""100%"" cellspacing=""0"" cellpadding=""8"" style=""font-size: 14px;"">
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600; width: 40%;"">Mã đơn đặt chỗ:</td>
                                        <td style=""color: #0f172a; font-weight: 700;"">#" + bookingId + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Biển số xe:</td>
                                        <td style=""color: #0f172a; font-weight: 700; font-size: 16px;"">" + licensePlate + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Loại phương tiện:</td>
                                        <td style=""color: #0f172a;"">" + vehicleTypeName + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Thời gian dự kiến vào:</td>
                                        <td style=""color: #0f172a;"">" + arrivalStr + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Hạn giữ chỗ đến:</td>
                                        <td style=""color: #0f172a;"">" + expiredStr + @"</td>
                                    </tr>
                                    <tr style=""border-top: 1px dashed #cbd5e1;"">
                                        <td style=""color: #64748b; font-weight: 600; padding-top: 12px;"">Số tiền cọc đã trả:</td>
                                        <td style=""color: #059669; font-weight: 700; font-size: 18px; padding-top: 12px;"">" + amountStr + @" VNĐ</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Phương thức thanh toán:</td>
                                        <td style=""color: #0f172a;"">" + paymentMethod + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Mã giao dịch:</td>
                                        <td style=""color: #475569; font-family: monospace;"">" + transactionId + @"</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Notice & Instructions -->
                            <div style=""border-left: 4px solid #10b981; background-color: #f0fdf4; padding: 15px 20px; border-radius: 4px; margin-bottom: 25px;"">
                                <h4 style=""margin: 0 0 8px 0; color: #065f46; font-size: 15px;"">📌 Hướng dẫn khi vào bãi đỗ xe:</h4>
                                <ul style=""margin: 0; padding-left: 18px; color: #166534; font-size: 13px; line-height: 1.6;"">
                                    <li>Vui lòng di chuyển xe đến bãi đúng biển số đăng ký <strong>" + licensePlate + @"</strong>.</li>
                                    <li>Mã giữ chỗ có hiệu lực đến trước <strong>" + expiredTimeStr + @"</strong>. Quá thời gian này đơn sẽ tự động bị hủy theo quy định.</li>
                                </ul>
                            </div>

                            <p style=""font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;"">
                                Nếu Quý khách cần hỗ trợ thêm, vui lòng liên hệ hotline bộ phận CSKH eParking hoặc truy cập trang quản lý đơn đặt chỗ trên ứng dụng.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style=""background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;"">
                            <p style=""margin: 0; font-size: 13px; color: #64748b;"">Trân trọng,</p>
                            <p style=""margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #0f172a;"">Đội ngũ eParking Management</p>
                            <p style=""margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;"">
                                Đây là email tự động từ hệ thống. Vui lòng không phản hồi trực tiếp vào thư này.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        public static string BuildBookingCancelledEmailHtml(
            string userName,
            string bookingId,
            string licensePlate,
            decimal refundAmount)
        {
            string refundStr = refundAmount.ToString("N0");

            return @"<!DOCTYPE html>
<html lang=""vi"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Thông báo hủy đơn đặt chỗ bãi xe</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b;"">
    <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" style=""background-color: #f4f6f8; padding: 30px 0;"">
        <tr>
            <td align=""center"">
                <table role=""presentation"" width=""600"" cellspacing=""0"" cellpadding=""0"" style=""background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);"">
                    <!-- Header -->
                    <tr>
                        <td style=""background: linear-gradient(135deg, #0f172a 0%, #334155 100%); padding: 30px; text-align: center;"">
                            <h1 style=""color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;"">eParking System</h1>
                            <p style=""color: #cbd5e1; margin: 8px 0 0 0; font-size: 15px;"">Xác nhận Hủy đơn đặt chỗ đỗ xe</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style=""padding: 35px 30px;"">
                            <p style=""font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;"">
                                Kính gửi <strong>" + userName + @"</strong>,
                            </p>
                            <p style=""font-size: 15px; margin: 0 0 25px 0; line-height: 1.6; color: #475569;"">
                                Hệ thống <strong>eParking</strong> xác nhận đơn đặt chỗ đỗ xe của Quý khách đã được hủy thành công. Dưới đây là thông tin chi tiết đơn hủy:
                            </p>

                            <!-- Cancel Card -->
                            <div style=""background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px;"">
                                <table width=""100%"" cellspacing=""0"" cellpadding=""8"" style=""font-size: 14px;"">
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600; width: 40%;"">Mã đơn đặt chỗ:</td>
                                        <td style=""color: #0f172a; font-weight: 700;"">#" + bookingId + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Biển số xe:</td>
                                        <td style=""color: #0f172a; font-weight: 700; font-size: 16px;"">" + licensePlate + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Trạng thái đơn:</td>
                                        <td>
                                            <span style=""background-color: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 13px;"">
                                                ĐÃ HỦY
                                            </span>
                                        </td>
                                    </tr>
                                    <tr style=""border-top: 1px dashed #cbd5e1;"">
                                        <td style=""color: #64748b; font-weight: 600; padding-top: 12px;"">Số tiền cọc đã hủy/hoàn:</td>
                                        <td style=""color: #059669; font-weight: 700; font-size: 18px; padding-top: 12px;"">" + refundStr + @" VNĐ</td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Refund Info -->
                            <div style=""border-left: 4px solid #64748b; background-color: #f1f5f9; padding: 15px 20px; border-radius: 4px; margin-bottom: 25px;"">
                                <h4 style=""margin: 0 0 8px 0; color: #334155; font-size: 15px;"">ℹ️ Thông tin về tiền đặt cọc:</h4>
                                <p style=""margin: 0; color: #475569; font-size: 13px; line-height: 1.6;"">
                                    Nếu đơn đỗ xe của Quý khách đã thanh toán cọc trước khi hủy, số tiền cọc sẽ được xử lý hoàn lại theo chính sách của bãi xe hoặc liên hệ bộ phận hỗ trợ để nhận hoàn tiền.
                                </p>
                            </div>

                            <p style=""font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;"">
                                Rất tiếc vì chưa thể phục vụ Quý khách lần này. Hy vọng sẽ được đón tiếp Quý khách trong các lượt đỗ xe tiếp theo!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style=""background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;"">
                            <p style=""margin: 0; font-size: 13px; color: #64748b;"">Trân trọng,</p>
                            <p style=""margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #0f172a;"">Đội ngũ eParking Management</p>
                            <p style=""margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;"">
                                Đây là email tự động từ hệ thống. Vui lòng không phản hồi trực tiếp vào thư này.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        public static string BuildCheckInSuccessEmailHtml(
            string userName,
            string bookingId,
            string licensePlate,
            string vehicleTypeName,
            string zoneName,
            DateTime checkInTime)
        {
            string checkInTimeStr = checkInTime.ToString("HH:mm - dd/MM/yyyy");

            return @"<!DOCTYPE html>
<html lang=""vi"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Thông báo xe vào bãi đỗ</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b;"">
    <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" style=""background-color: #f4f6f8; padding: 30px 0;"">
        <tr>
            <td align=""center"">
                <table role=""presentation"" width=""600"" cellspacing=""0"" cellpadding=""0"" style=""background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);"">
                    <!-- Header -->
                    <tr>
                        <td style=""background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); padding: 30px; text-align: center;"">
                            <h1 style=""color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;"">eParking System</h1>
                            <p style=""color: #dbeafe; margin: 8px 0 0 0; font-size: 15px;"">Xác nhận Xe đã vào bãi đỗ (Check-in)</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style=""padding: 35px 30px;"">
                            <p style=""font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;"">
                                Kính gửi <strong>" + userName + @"</strong>,
                            </p>
                            <p style=""font-size: 15px; margin: 0 0 25px 0; line-height: 1.6; color: #475569;"">
                                Hệ thống <strong>eParking</strong> xác nhận phương tiện theo đơn đặt chỗ của Quý khách đã hoàn tất thủ tục vào cổng bãi đỗ xe với thông tin chi tiết như sau:
                            </p>

                            <!-- Checkin Card -->
                            <div style=""background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px;"">
                                <table width=""100%"" cellspacing=""0"" cellpadding=""8"" style=""font-size: 14px;"">
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600; width: 40%;"">Mã đơn đặt chỗ:</td>
                                        <td style=""color: #0f172a; font-weight: 700;"">#" + bookingId + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Biển số xe:</td>
                                        <td style=""color: #1d4ed8; font-weight: 700; font-size: 16px;"">" + licensePlate + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Loại phương tiện:</td>
                                        <td style=""color: #0f172a;"">" + vehicleTypeName + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Phân khu đỗ xe:</td>
                                        <td style=""color: #059669; font-weight: 700;"">" + zoneName + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Thời gian vào bãi:</td>
                                        <td style=""color: #0f172a; font-weight: 600;"">" + checkInTimeStr + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Trạng thái:</td>
                                        <td>
                                            <span style=""background-color: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 13px;"">
                                                ĐÃ VÀO BÃI
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Tips -->
                            <div style=""border-left: 4px solid #3b82f6; background-color: #eff6ff; padding: 15px 20px; border-radius: 4px; margin-bottom: 25px;"">
                                <h4 style=""margin: 0 0 8px 0; color: #1e40af; font-size: 15px;"">🔒 Khóa xe an toàn từ xa:</h4>
                                <p style=""margin: 0; color: #1e3a8a; font-size: 13px; line-height: 1.6;"">
                                    Quý khách có thể sử dụng tính năng <strong>Khóa xe từ xa</strong> trên ứng dụng eParking để bảo vệ xe an toàn tuyệt đối trong suốt thời gian đỗ.
                                </p>
                            </div>

                            <p style=""font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;"">
                                Chúc Quý khách có trải nghiệm đỗ xe an toàn và thuận tiện tại eParking!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style=""background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;"">
                            <p style=""margin: 0; font-size: 13px; color: #64748b;"">Trân trọng,</p>
                            <p style=""margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #0f172a;"">Đội ngũ eParking Management</p>
                            <p style=""margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;"">
                                Đây là email tự động từ hệ thống. Vui lòng không phản hồi trực tiếp vào thư này.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        public static string BuildCheckOutSuccessEmailHtml(
            string userName,
            string bookingIdOrSessionId,
            string licensePlate,
            string vehicleTypeName,
            DateTime checkInTime,
            DateTime checkOutTime,
            int durationMinutes,
            decimal totalFeePaid)
        {
            string checkInStr = checkInTime.ToString("HH:mm - dd/MM/yyyy");
            string checkOutStr = checkOutTime.ToString("HH:mm - dd/MM/yyyy");

            int hours = durationMinutes / 60;
            int mins = durationMinutes % 60;
            string durationStr = hours > 0 ? $"{hours} giờ {mins} phút" : $"{mins} phút";

            string feeStr = totalFeePaid > 0 ? $"{totalFeePaid:N0} VNĐ" : "0 VNĐ (Đã thanh toán đủ)";

            return @"<!DOCTYPE html>
<html lang=""vi"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Cảm ơn &amp; Hóa đơn hoàn thành đỗ xe</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b;"">
    <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" style=""background-color: #f4f6f8; padding: 30px 0;"">
        <tr>
            <td align=""center"">
                <table role=""presentation"" width=""600"" cellspacing=""0"" cellpadding=""0"" style=""background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);"">
                    <!-- Header -->
                    <tr>
                        <td style=""background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 30px; text-align: center;"">
                            <h1 style=""color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;"">eParking System</h1>
                            <p style=""color: #c7d2fe; margin: 8px 0 0 0; font-size: 15px;"">Thông báo hoàn thành đỗ xe</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style=""padding: 35px 30px;"">
                            <p style=""font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;"">
                                Kính gửi <strong>" + userName + @"</strong>,
                            </p>
                            <p style=""font-size: 15px; margin: 0 0 25px 0; line-height: 1.6; color: #475569;"">
                                Chúc mừng Quý khách đã hoàn tất lượt đỗ xe an toàn tại hệ thống <strong>eParking</strong>. Dưới đây là thông tin tổng kết chi tiết lượt đỗ của Quý khách:
                            </p>

                            <!-- Checkout Receipt Card -->
                            <div style=""background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 25px;"">
                                <table width=""100%"" cellspacing=""0"" cellpadding=""8"" style=""font-size: 14px;"">
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600; width: 40%;"">Mã đơn/phiên:</td>
                                        <td style=""color: #0f172a; font-weight: 700;"">#" + bookingIdOrSessionId + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Biển số xe:</td>
                                        <td style=""color: #312e81; font-weight: 700; font-size: 16px;"">" + licensePlate + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Loại phương tiện:</td>
                                        <td style=""color: #0f172a;"">" + vehicleTypeName + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Thời gian vào bãi:</td>
                                        <td style=""color: #0f172a;"">" + checkInStr + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Thời gian ra bãi:</td>
                                        <td style=""color: #0f172a;"">" + checkOutStr + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Tổng thời gian gửi:</td>
                                        <td style=""color: #0f172a; font-weight: 700;"">" + durationStr + @"</td>
                                    </tr>
                                    <tr style=""border-top: 1px dashed #cbd5e1;"">
                                        <td style=""color: #64748b; font-weight: 600; padding-top: 12px;"">Phí thanh toán khi ra:</td>
                                        <td style=""color: #059669; font-weight: 700; font-size: 18px; padding-top: 12px;"">" + feeStr + @"</td>
                                    </tr>
                                    <tr>
                                        <td style=""color: #64748b; font-weight: 600;"">Trạng thái:</td>
                                        <td>
                                            <span style=""background-color: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 13px;"">
                                                HOÀN THÀNH LƯỢT ĐỖ
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Thank you message box -->
                            <div style=""border-left: 4px solid #10b981; background-color: #f0fdf4; padding: 15px 20px; border-radius: 4px; margin-bottom: 25px;"">
                                <h4 style=""margin: 0 0 8px 0; color: #065f46; font-size: 15px;"">💚 Cảm ơn Quý khách!</h4>
                                <p style=""margin: 0; color: #166534; font-size: 13px; line-height: 1.6;"">
                                    Sự tin tưởng của Quý khách là niềm vinh hạnh của eParking. Rất hân hạnh được đón tiếp Quý khách trong những lượt gửi xe tiếp theo!
                                </p>
                            </div>

                            <p style=""font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;"">
                                Nếu Quý khách cần tra cứu thêm lịch sử lượt đỗ hoặc cần xuất hóa đơn, vui lòng kiểm tra trên ứng dụng eParking.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style=""background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;"">
                            <p style=""margin: 0; font-size: 13px; color: #64748b;"">Trân trọng,</p>
                            <p style=""margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #0f172a;"">Đội ngũ eParking Management</p>
                            <p style=""margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;"">
                                Đây là email tự động từ hệ thống. Vui lòng không phản hồi trực tiếp vào thư này.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }
    }
}
