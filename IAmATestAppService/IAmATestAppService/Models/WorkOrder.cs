using System;
using System.Collections.Generic;

namespace IAmATestAppService.Models;

public partial class WorkOrder
{
    public int Id { get; set; }

    public int CreatedById { get; set; }

    public DateTime CreatedAtTime { get; set; }

    public DateTime? CompletedAtTime { get; set; }

    public int? AssignedToId { get; set; }

    public bool Canceled { get; set; }

    public bool Active { get; set; }

    public bool Complete { get; set; }

    public string Description { get; set; } = null!;

    public byte Stage { get; set; }

    public virtual UserInternal? AssignedTo { get; set; }

    public virtual UserInternal? CreatedBy { get; set; } = null!;
}
