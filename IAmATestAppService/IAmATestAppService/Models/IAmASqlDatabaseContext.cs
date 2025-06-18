using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace IAmATestAppService.Models;

public partial class IAmASqlDatabaseContext : DbContext
{
    private readonly IConfiguration _configuration;
    public IAmASqlDatabaseContext()
    {
    }

    public IAmASqlDatabaseContext(DbContextOptions<IAmASqlDatabaseContext> options, IConfiguration configuration)
        : base(options)
    {
        _configuration = configuration;
    }

    public virtual DbSet<UserInternal> UserInternals { get; set; }

    public virtual DbSet<WorkOrder> WorkOrders { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer(_configuration.GetConnectionString("jmaSqlDb"));

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserInternal>(entity =>
        {
            entity.ToTable("UserInternal");

            entity.Property(e => e.FirstName)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.LastName)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<WorkOrder>(entity =>
        {
            entity.ToTable("WorkOrder");

            entity.HasIndex(e => e.Active, "Index_WorkOrder_1");

            entity.HasOne(d => d.AssignedTo).WithMany(p => p.WorkOrderAssignedTos).HasForeignKey(d => d.AssignedToId);

            entity.HasOne(d => d.CreatedBy).WithMany(p => p.WorkOrderCreatedBys)
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
