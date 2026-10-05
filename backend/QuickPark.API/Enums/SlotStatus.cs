namespace QuickPark.API.Enums;

// Owner-settable: AVAILABLE, MAINTENANCE, DISABLED. RESERVED and OCCUPIED are derived, never stored,
// and an unpaid booking is shown as PENDING rather than as the RESERVED a settled fee earns.
public enum SlotStatus
{
    AVAILABLE,
    RESERVED,
    OCCUPIED,
    MAINTENANCE,
    DISABLED
}
