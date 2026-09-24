namespace QuickPark.API.Enums;

// Owner-settable: AVAILABLE, MAINTENANCE, DISABLED. RESERVED and OCCUPIED are derived, never stored.
public enum SlotStatus
{
    AVAILABLE,
    RESERVED,
    OCCUPIED,
    MAINTENANCE,
    DISABLED
}
