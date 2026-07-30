using Microsoft.Extensions.Options;
using ParkingManagement.Models;
using ParkingManagement.Data;
using System;
using System.Net;
using System.Net.Http;
using System.Net.Mail;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace ParkingManagement.Services.EmailServices;

public class EmailService : IEmailService
{
    private readonly MailSettings _mailSettings;
    private readonly ILogger<EmailService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    private static readonly HttpClient _httpClient;

    static EmailService()
    {
        // Bỏ qua lỗi SSL UntrustedRoot khi ứng dụng chạy trong môi trường Docker Linux
        var handler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
        };
        _httpClient = new HttpClient(handler);
    }

    public EmailService(IOptions<MailSettings> mailSettings, ILogger<EmailService> logger, IServiceScopeFactory scopeFactory)
    {
        _mailSettings = mailSettings.Value;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        // 1. Nếu cấu hình là Brevo v3 API Key (bắt đầu bằng 'xkeysib-'), gửi qua Brevo HTTP API
        if (!string.IsNullOrEmpty(_mailSettings.Password) && _mailSettings.Password.StartsWith("xkeysib-"))
        {
            var isBrevoSuccess = await SendViaBrevoApiAsync(toEmail, subject, body);
            if (isBrevoSuccess) return;
        }

        // 2. Gửi qua SMTP bằng MailKit (Khắc phục triệt để lỗi UntrustedRoot trong Docker & Linux)
        try
        {
            var mimeMessage = new MimeKit.MimeMessage();
            mimeMessage.From.Add(new MimeKit.MailboxAddress(_mailSettings.DisplayName ?? "Parking Management", _mailSettings.Mail));
            mimeMessage.To.Add(new MimeKit.MailboxAddress(toEmail, toEmail));
            mimeMessage.Subject = subject;

            var bodyBuilder = new MimeKit.BodyBuilder
            {
                HtmlBody = body
            };
            mimeMessage.Body = bodyBuilder.ToMessageBody();

            var login = string.IsNullOrEmpty(_mailSettings.Username) ? _mailSettings.Mail : _mailSettings.Username;

            using var client = new MailKit.Net.Smtp.SmtpClient();

            // Cho phép tất cả chứng chỉ SSL/TLS (Bỏ qua hoàn toàn UntrustedRoot khi chạy trong Docker/Linux)
            client.ServerCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) => true;

            await client.ConnectAsync(_mailSettings.Host, _mailSettings.Port, MailKit.Security.SecureSocketOptions.Auto);
            await client.AuthenticateAsync(login, _mailSettings.Password);
            await client.SendAsync(mimeMessage);
            await client.DisconnectAsync(true);

            _logger.LogInformation($"[EmailService] Gửi email SMTP MailKit thành công tới: {toEmail}");
        }
        catch (Exception smtpEx)
        {
            var errorDetails = smtpEx.InnerException != null ? $"{smtpEx.Message} (Chi tiết: {smtpEx.InnerException.Message})" : smtpEx.Message;
            _logger.LogError($"[EmailService] Lỗi SMTP MailKit: {errorDetails}");
            await SaveLogToDatabaseAsync("Error", $"Lỗi gửi mail SMTP tới {toEmail}. Chi tiết: {errorDetails}", "EmailService");
        }
    }

    private async Task<bool> SendViaBrevoApiAsync(string toEmail, string subject, string body)
    {
        try
        {
            using var requestMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
            requestMessage.Headers.Add("api-key", _mailSettings.Password);
            requestMessage.Headers.Add("accept", "application/json");

            var payload = new
            {
                sender = new { name = !string.IsNullOrEmpty(_mailSettings.DisplayName) ? _mailSettings.DisplayName : "Parking Management System", email = _mailSettings.Mail },
                to = new[] { new { email = toEmail } },
                subject = subject,
                htmlContent = body
            };

            var jsonContent = JsonSerializer.Serialize(payload);
            requestMessage.Content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(requestMessage);
            var responseString = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation($"[EmailService Brevo API] Gửi email thành công tới: {toEmail}");
                return true;
            }
            else
            {
                _logger.LogError($"[EmailService Brevo API] Lỗi ({response.StatusCode}): {responseString}");
                await SaveLogToDatabaseAsync("Error", $"Lỗi Brevo HTTP API ({response.StatusCode}): {responseString}", "EmailService");
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"[EmailService Brevo API Exception]: {ex.Message}");
            await SaveLogToDatabaseAsync("Error", $"Lỗi kết nối Brevo API: {ex.Message}", "EmailService");
            return false;
        }
    }

    private async Task SaveLogToDatabaseAsync(string logLevel, string message, string source)
    {
        using (var scope = _scopeFactory.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var logEntry = new SystemLog
            {
                LogLevel = logLevel,
                Message = message,
                Source = source,
                CreatedAt = DateTime.UtcNow 
            };

            context.SystemLogs.Add(logEntry);
            await context.SaveChangesAsync();
        }
    }
}
