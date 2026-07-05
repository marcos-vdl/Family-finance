using System;
using System.Linq;
using System.Threading.Tasks;
using FamilyFinance.Application.DTOs;
using FamilyFinance.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace FamilyFinance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        // Todas as rotas (exceto o login) exigem os headers X-Admin-Username / X-Admin-Password
        // com as credenciais definidas em appsettings.json -> AdminSettings.
        private bool IsAuthorized()
        {
            var username = Request.Headers["X-Admin-Username"].ToString();
            var password = Request.Headers["X-Admin-Password"].ToString();
            return _adminService.ValidateCredentials(username, password);
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] AdminLoginDto dto)
        {
            if (!_adminService.ValidateCredentials(dto.Username, dto.Password))
                return Unauthorized(new { message = "Usuário ou senha de administrador inválidos." });

            return Ok(new { message = "ok" });
        }

        [HttpGet("families")]
        public async Task<IActionResult> GetFamilies()
        {
            if (!IsAuthorized())
                return Unauthorized(new { message = "Acesso administrativo negado." });

            var families = await _adminService.GetAllFamiliesAsync();

            var result = families.Select(f => new
            {
                id = f.Id,
                name = f.Name,
                city = f.City,
                memberCount = f.MemberCount,
                username = f.Username,
                mustChangePassword = f.MustChangePassword,
                createdAt = f.CreatedAt,
                registeredPeopleCount = f.Members.Count
            });

            return Ok(new
            {
                totalFamilies = families.Count,
                families = result
            });
        }

        [HttpPost("families/{familyId}/reset-password")]
        public async Task<IActionResult> ResetPassword(Guid familyId)
        {
            if (!IsAuthorized())
                return Unauthorized(new { message = "Acesso administrativo negado." });

            try
            {
                await _adminService.ResetFamilyPasswordAsync(familyId);
                return Ok(new { message = "Senha redefinida para 123456. A família vai precisar trocar no próximo login." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("families/{familyId}")]
        public async Task<IActionResult> DeleteFamily(Guid familyId)
        {
            if (!IsAuthorized())
                return Unauthorized(new { message = "Acesso administrativo negado." });

            try
            {
                await _adminService.DeleteFamilyAsync(familyId);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
