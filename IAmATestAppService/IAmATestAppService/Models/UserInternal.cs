using System;
using System.Collections.Generic;

namespace IAmATestAppService.Models;

public partial class UserInternal
{
    public int Id { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public int? MiddleName { get; set; }

    public virtual ICollection<WorkOrder> WorkOrderAssignedTos { get; set; } = new List<WorkOrder>();

    public virtual ICollection<WorkOrder> WorkOrderCreatedBys { get; set; } = new List<WorkOrder>();
}
