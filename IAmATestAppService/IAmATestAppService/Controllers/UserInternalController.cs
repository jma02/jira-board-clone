using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IAmATestAppService.Models;

namespace IAmATestAppService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserInternalController : ControllerBase
    {
        private readonly IAmASqlDatabaseContext _context;

        public UserInternalController(IAmASqlDatabaseContext context)
        {
            _context = context;
        }

        // GET: api/UserInternal
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserInternal>>> GetUserInternals()
        {
            return await _context.UserInternals.ToListAsync();
        }

        // GET: api/UserInternal/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UserInternal>> GetUserInternal(int id)
        {
            var userInternal = await _context.UserInternals.FindAsync(id);

            if (userInternal == null)
            {
                return NotFound();
            }

            return userInternal;
        }

        // PUT: api/UserInternal/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUserInternal(int id, UserInternal userInternal)
        {
            if (id != userInternal.Id)
            {
                return BadRequest();
            }

            _context.Entry(userInternal).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserInternalExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/UserInternal
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<UserInternal>> PostUserInternal(UserInternal userInternal)
        {
            _context.UserInternals.Add(userInternal);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUserInternal", new { id = userInternal.Id }, userInternal);
        }

        // DELETE: api/UserInternal/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUserInternal(int id)
        {
            var userInternal = await _context.UserInternals.FindAsync(id);
            if (userInternal == null)
            {
                return NotFound();
            }

            _context.UserInternals.Remove(userInternal);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserInternalExists(int id)
        {
            return _context.UserInternals.Any(e => e.Id == id);
        }
    }
}
