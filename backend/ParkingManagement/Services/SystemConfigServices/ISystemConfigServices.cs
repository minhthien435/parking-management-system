using System.Collections.Generic;
using System.Threading.Tasks;
using ParkingManagement.Models;
using ParkingManagement.DTOs.Admin;

namespace ParkingManagement.Services
{
    public interface ISystemConfigService
    {
        Task<IEnumerable<SystemSetting>> GetAllSettingsAsync();
        Task<bool> UpdateSettingAsync(string key, UpdateSystemSettingDto dto);
        Task<(IEnumerable<SystemLog> logs, int totalItems, int totalPages)> GetSystemLogsAsync(string? level, int page, int pageSize);
        Task LogActivityAsync(string logLevel, string message, string? source = null);

        // Cached lookup used by hot paths (rate limiting middleware, login token issuance)
        // so they don't hit the database on every single request.
        Task<int> GetIntSettingAsync(string key, int defaultValue);
    }
}