using System;
using System.Threading.Tasks;
using FamilyFinance.Application.DTOs;
using FamilyFinance.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace FamilyFinance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterFamilyDto dto)
        {
            try
            {
                var (family, defaultPassword) = await _authService.RegisterAsync(dto);
                return Ok(new
                {
                    id = family.Id,
                    name = family.Name,
                    city = family.City,
                    memberCount = family.MemberCount,
                    username = family.Username,
                    mustChangePassword = family.MustChangePassword,
                    defaultPassword
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                var family = await _authService.LoginAsync(dto);
                return Ok(new
                {
                    id = family.Id,
                    name = family.Name,
                    city = family.City,
                    memberCount = family.MemberCount,
                    username = family.Username,
                    mustChangePassword = family.MustChangePassword
                });
            }
            catch (InvalidOperationException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            try
            {
                await _authService.ChangePasswordAsync(dto);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
