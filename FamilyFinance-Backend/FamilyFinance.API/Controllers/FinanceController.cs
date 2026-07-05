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
    public class FinanceController : ControllerBase
    {
        private readonly IFinanceService _financeService;

        public FinanceController(IFinanceService financeService)
        {
            _financeService = financeService;
        }

        [HttpPost("family")]
        public async Task<IActionResult> CreateFamily([FromBody] CreateFamilyDto dto)
        {
            var family = await _financeService.CreateFamilyAsync(dto.Name);
            return Ok(new
            {
                id = family.Id,
                name = family.Name
            });
        }

        [HttpPost("person")]
        public async Task<IActionResult> CreatePerson([FromBody] CreatePersonDto dto)
        {
            try
            {
                var person = await _financeService.CreatePersonAsync(dto);
                return Ok(new
                {
                    id = person.Id,
                    familyId = person.FamilyId,
                    name = person.Name,
                    birthDate = person.BirthDate,
                    isPrincipal = person.IsPrincipal
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("person/family/{familyId}")]
        public async Task<IActionResult> GetPeopleByFamily(Guid familyId)
        {
            try
            {
                var people = await _financeService.GetPeopleByFamilyAsync(familyId);
                var result = people.Select(p => new
                {
                    id = p.Id,
                    familyId = p.FamilyId,
                    name = p.Name,
                    birthDate = p.BirthDate,
                    isPrincipal = p.IsPrincipal,
                    isUnderAge = p.IsUnderAge()
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Exige informar quem está executando a exclusão (fica registrado no log com nome e data).
        [HttpDelete("person/{personId}")]
        public async Task<IActionResult> DeletePerson(Guid personId, [FromBody] DeletePersonDto dto)
        {
            try
            {
                await _financeService.DeletePersonAsync(personId, dto.DeletedByPersonId);
                return NoContent();
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

        [HttpPost("transaction")]
        public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDto dto)
        {
            try
            {
                var transaction = await _financeService.CreateTransactionAsync(dto);

                // Retorna um objeto limpo, quebrando o ciclo de referência circular do EF Core
                return Ok(new
                {
                    id = transaction.Id,
                    personId = transaction.PersonId,
                    description = transaction.Description,
                    amount = transaction.Amount,
                    type = transaction.Type.ToString(),
                    createdAt = transaction.CreatedAt
                });
            }
            catch (InvalidOperationException ex)
            {
                // Captura a nossa validação da regra de negócio dos 18 anos e retorna 400 (Bad Request)
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("transaction/{transactionId}")]
        public async Task<IActionResult> UpdateTransaction(Guid transactionId, [FromBody] UpdateTransactionDto dto)
        {
            try
            {
                var transaction = await _financeService.UpdateTransactionAsync(transactionId, dto);
                return Ok(new
                {
                    id = transaction.Id,
                    personId = transaction.PersonId,
                    description = transaction.Description,
                    amount = transaction.Amount,
                    type = transaction.Type.ToString(),
                    createdAt = transaction.CreatedAt
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

        [HttpDelete("transaction/{transactionId}")]
        public async Task<IActionResult> DeleteTransaction(Guid transactionId)
        {
            try
            {
                await _financeService.DeleteTransactionAsync(transactionId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("report/person/{personId}")]
        public async Task<IActionResult> GetIndividualReport(Guid personId, [FromQuery] int? year, [FromQuery] int? month)
        {
            try
            {
                var report = await _financeService.GetIndividualReportAsync(personId, year, month);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("report/family/{familyId}")]
        public async Task<IActionResult> GetFamilyReport(Guid familyId, [FromQuery] int? year, [FromQuery] int? month)
        {
            try
            {
                var report = await _financeService.GetFamilyReportAsync(familyId, year, month);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Lista os meses/anos que possuem alguma movimentação, para montar a aba "Histórico".
        [HttpGet("report/family/{familyId}/available-months")]
        public async Task<IActionResult> GetAvailableMonths(Guid familyId)
        {
            try
            {
                var months = await _financeService.GetAvailableMonthsAsync(familyId);
                return Ok(months);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("fixed-expense")]
        public async Task<IActionResult> CreateFixedExpense([FromBody] CreateFixedExpenseDto dto)
        {
            try
            {
                var expense = await _financeService.CreateFixedExpenseAsync(dto);
                return Ok(new
                {
                    id = expense.Id,
                    familyId = expense.FamilyId,
                    description = expense.Description,
                    amount = expense.Amount,
                    isPaid = expense.IsPaid,
                    createdAt = expense.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("fixed-expense/family/{familyId}")]
        public async Task<IActionResult> GetFixedExpensesByFamily(Guid familyId)
        {
            try
            {
                var expenses = await _financeService.GetFixedExpensesByFamilyAsync(familyId);
                var result = expenses.Select(e => new
                {
                    id = e.Id,
                    familyId = e.FamilyId,
                    description = e.Description,
                    amount = e.Amount,
                    isPaid = e.IsPaid,
                    createdAt = e.CreatedAt,
                    paidAt = e.PaidAt
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("fixed-expense/{fixedExpenseId}/pay")]
        public async Task<IActionResult> MarkFixedExpenseAsPaid(Guid fixedExpenseId)
        {
            try
            {
                await _financeService.MarkFixedExpenseAsPaidAsync(fixedExpenseId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Só permite apagar quando já estiver quitada; isso gera um registro em AuditLog
        // atribuído ao principal/moderador da família.
        [HttpDelete("fixed-expense/{fixedExpenseId}")]
        public async Task<IActionResult> DeleteFixedExpense(Guid fixedExpenseId)
        {
            try
            {
                await _financeService.DeleteFixedExpenseAsync(fixedExpenseId);
                return NoContent();
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

        [HttpGet("audit-log/family/{familyId}")]
        public async Task<IActionResult> GetAuditLogsByFamily(Guid familyId)
        {
            try
            {
                var logs = await _financeService.GetAuditLogsByFamilyAsync(familyId);
                var result = logs.Select(l => new
                {
                    id = l.Id,
                    familyId = l.FamilyId,
                    principalPersonId = l.PrincipalPersonId,
                    principalName = l.PrincipalName,
                    action = l.Action.ToString(),
                    description = l.Description,
                    createdAt = l.CreatedAt
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
