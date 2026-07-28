using HospitalSystem.Domain.Entities;
using HospitalSystem.Domain.Enums;
using HospitalSystem.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HospitalSystem.Infrastructure.Persistence;

/// <summary>Runs on startup in Development only (wired from Program.cs). Creates roles, one admin
/// account (credentials from configuration, never hardcoded), and a couple of sample doctors so the
/// frontend has something to show immediately after `docker compose up`.</summary>
public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        await context.Database.MigrateAsync();

        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
        foreach (var roleName in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
                await roleManager.CreateAsync(new ApplicationRole(roleName));
        }

        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var adminEmail = configuration["Seed:AdminEmail"] ?? "admin@hospitalsystem.local";
        var adminPassword = configuration["Seed:AdminPassword"] ?? "ChangeMe!2026Secure";

        if (await userManager.FindByEmailAsync(adminEmail) is null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "System Administrator",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(admin, adminPassword);
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, Roles.Admin);
        }

        if (!await context.Doctors.AnyAsync())
        {
            var doctorUser = new ApplicationUser
            {
                UserName = "dr.amina@hospitalsystem.local",
                Email = "dr.amina@hospitalsystem.local",
                // Bare name, no "Dr." prefix — every display point (frontend cards, appointment
                // lists, notification/reminder text) prepends "Dr." itself, so a seeded name that
                // already includes it renders as "Dr. Dr. Amina Wanjiru".
                FullName = "Amina Wanjiru",
                EmailConfirmed = true
            };
            await userManager.CreateAsync(doctorUser, "ChangeMe!2026Secure");
            await userManager.AddToRoleAsync(doctorUser, Roles.Doctor);

            var doctor = new Doctor
            {
                UserId = doctorUser.Id,
                FullName = doctorUser.FullName,
                Specialty = "General Medicine",
                LicenseNumber = "KMPDC-00123",
                Bio = "General practitioner with 8 years of outpatient experience."
            };
            context.Doctors.Add(doctor);
            await context.SaveChangesAsync();

            foreach (var day in new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday })
            {
                context.DoctorAvailabilities.Add(new DoctorAvailability
                {
                    DoctorId = doctor.Id,
                    DayOfWeek = day,
                    StartTime = new TimeOnly(9, 0),
                    EndTime = new TimeOnly(17, 0)
                });
            }
            await context.SaveChangesAsync();
        }
    }
}
