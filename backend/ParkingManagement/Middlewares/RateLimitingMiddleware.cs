using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ParkingManagement.Services;

namespace ParkingManagement.Middlewares
{
    public class RateLimitingOptions
    {
        public int Limit { get; set; } = 100; // requests
        public int WindowSeconds { get; set; } = 60; // window in seconds
    }

    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly ILogger<RateLimitingMiddleware> _logger;
        private readonly RateLimitingOptions _options;

        public RateLimitingMiddleware(RequestDelegate next, IMemoryCache cache, IOptions<RateLimitingOptions> options, ILogger<RateLimitingMiddleware> logger)
        {
            _next = next;
            _cache = cache;
            _logger = logger;
            _options = options.Value ?? new RateLimitingOptions();
        }

        private class RateLimitCounter
        {
            public int Count { get; set; }
        }

        // ISystemConfigService is scoped, so it's injected here (per-request) rather than via the constructor.
        public async Task InvokeAsync(HttpContext context, ISystemConfigService configService)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                if (context.User.IsInRole("SystemAdmin") ||
                    context.User.IsInRole("ParkingManager") ||
                    context.User.IsInRole("ParkingStaff"))
                {
                    await _next(context);
                    return;
                }
            }

            // Admin-configurable via Admin > Settings > Security; falls back to appsettings.json if unset.
            var limit = await configService.GetIntSettingAsync("rateLimitRequests", _options.Limit);
            var windowSeconds = await configService.GetIntSettingAsync("rateLimitWindowSeconds", _options.WindowSeconds);

            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var key = $"rl_{ip}";

            var counter = _cache.GetOrCreate(key, entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(windowSeconds);
                return new RateLimitCounter { Count = 0 };
            }) ?? new RateLimitCounter { Count = 0 };

            counter.Count++;

            if (counter.Count > limit)
            {
                _logger.LogWarning("Rate limit exceeded for IP {Ip}: {Count}/{Limit}", ip, counter.Count, limit);
                context.Response.StatusCode = 429;
                context.Response.ContentType = "application/json";
                context.Response.Headers["Retry-After"] = windowSeconds.ToString();
                var body = JsonSerializer.Serialize(new { success = false, message = "Too many requests" });
                await context.Response.WriteAsync(body);
                return;
            }

            await _next(context);
        }
    }
}