The core of a classic machine-coding problem. The point isn't a huge system: it's clean classes, enums, a swappable strategy, and rules in the right place.

<!-- exercise: b71_e1 | Medium | Parking lot core -->
**Concepts:** enums · a Strategy interface for fees · a `Map` from ticket to spot · rules living in the class that owns the data

**Task.** Complete the parking lot:

- A vehicle may park in a spot of **its size or bigger** (`BIKE` < `CAR` < `TRUCK`), taking the **first free** suitable spot by id.
- `park(plate, type)` returns a ticket id like `T1`, or throws `IllegalStateException("No spot for " + type)` when nothing suitable is free.
- `leave(ticketId, hours)` frees the spot and returns the fee from the `FeeStrategy`.
- The fee strategy is hourly: BIKE 10, CAR 20, TRUCK 50 per hour, with a minimum charge of one hour.

**Starter code** · `ParkingLot.java`

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

enum Size { BIKE, CAR, TRUCK }   // declared smallest to largest: compareTo follows this order

record Spot(int id, Size size) { }

interface FeeStrategy { int fee(Size vehicle, int hours); }

public class ParkingLot {
    private final List<Spot> spots = new ArrayList<>();
    private final Map<String, Spot> ticketToSpot = new HashMap<>();
    private final Map<String, Size> ticketToVehicle = new HashMap<>();
    private final FeeStrategy fees;
    private int nextTicket = 1;

    ParkingLot(FeeStrategy fees, Size... spotSizes) {
        this.fees = fees;
        for (int i = 0; i < spotSizes.length; i++) {
            spots.add(new Spot(i + 1, spotSizes[i]));
        }
    }

    String park(String plate, Size vehicle) {
        // TODO: first free spot whose size is >= the vehicle's size; record the ticket
        throw new IllegalStateException("No spot for " + vehicle);
    }

    int leave(String ticketId, int hours) {
        // TODO: free the spot, return the fee
        return 0;
    }

    int freeSpots() {
        return spots.size() - ticketToSpot.size();
    }

    public static void main(String[] args) {
        FeeStrategy hourly = (vehicle, hours) -> 0; // TODO: BIKE 10, CAR 20, TRUCK 50 per hour, at least 1 hour
        ParkingLot lot = new ParkingLot(hourly, Size.BIKE, Size.CAR, Size.CAR, Size.TRUCK);

        String t1 = lot.park("KA01", Size.CAR);
        String t2 = lot.park("KA02", Size.BIKE);
        String t3 = lot.park("KA03", Size.CAR);
        String t4 = lot.park("KA04", Size.CAR);
        System.out.println(t1 + " " + t2 + " " + t3 + " " + t4 + ", free: " + lot.freeSpots());
        try {
            lot.park("KA05", Size.TRUCK);
        } catch (IllegalStateException e) {
            System.out.println(e.getMessage());
        }
        System.out.println("Fee for " + t1 + ": " + lot.leave(t1, 3));
        System.out.println("Fee for " + t2 + ": " + lot.leave(t2, 0));
        try {
            lot.park("KA06", Size.TRUCK);
        } catch (IllegalStateException e) {
            System.out.println("Still no spot for the truck");
        }
        System.out.println("Free spots: " + lot.freeSpots());
    }
}
```

**Expected output**

```text
T1 T2 T3 T4, free: 0
No spot for TRUCK
Fee for T1: 60
Fee for T2: 10
Still no spot for the truck
Free spots: 2
```

<!-- hints -->
- Enums compare by declaration order: `spot.size().compareTo(vehicle) >= 0` means "the spot is big enough".
- A spot is free if no ticket points at it: `!ticketToSpot.containsValue(spot)`.
- Notice car KA04 takes the **truck** spot (spot 4): the two car spots are taken, and a car fits in a truck spot. So even after T1 and T2 leave, the free spots are a car spot and the bike spot, and the truck still can't park.
- Fee strategy as a lambda: `(vehicle, hours) -> Math.max(1, hours) * switch (vehicle) { case BIKE -> 10; case CAR -> 20; case TRUCK -> 50; }`.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

enum Size { BIKE, CAR, TRUCK }

record Spot(int id, Size size) { }

interface FeeStrategy { int fee(Size vehicle, int hours); }

public class ParkingLot {
    private final List<Spot> spots = new ArrayList<>();
    private final Map<String, Spot> ticketToSpot = new HashMap<>();
    private final Map<String, Size> ticketToVehicle = new HashMap<>();
    private final FeeStrategy fees;
    private int nextTicket = 1;

    ParkingLot(FeeStrategy fees, Size... spotSizes) {
        this.fees = fees;
        for (int i = 0; i < spotSizes.length; i++) {
            spots.add(new Spot(i + 1, spotSizes[i]));
        }
    }

    String park(String plate, Size vehicle) {
        for (Spot spot : spots) {
            boolean bigEnough = spot.size().compareTo(vehicle) >= 0;
            if (bigEnough && !ticketToSpot.containsValue(spot)) {
                String ticket = "T" + nextTicket++;
                ticketToSpot.put(ticket, spot);
                ticketToVehicle.put(ticket, vehicle);
                return ticket;
            }
        }
        throw new IllegalStateException("No spot for " + vehicle);
    }

    int leave(String ticketId, int hours) {
        Spot spot = ticketToSpot.remove(ticketId);
        if (spot == null) {
            throw new IllegalArgumentException("Unknown ticket " + ticketId);
        }
        Size vehicle = ticketToVehicle.remove(ticketId);
        return fees.fee(vehicle, hours);
    }

    int freeSpots() {
        return spots.size() - ticketToSpot.size();
    }

    public static void main(String[] args) {
        FeeStrategy hourly = (vehicle, hours) -> Math.max(1, hours) * switch (vehicle) {
            case BIKE -> 10;
            case CAR -> 20;
            case TRUCK -> 50;
        };
        ParkingLot lot = new ParkingLot(hourly, Size.BIKE, Size.CAR, Size.CAR, Size.TRUCK);

        String t1 = lot.park("KA01", Size.CAR);
        String t2 = lot.park("KA02", Size.BIKE);
        String t3 = lot.park("KA03", Size.CAR);
        String t4 = lot.park("KA04", Size.CAR);
        System.out.println(t1 + " " + t2 + " " + t3 + " " + t4 + ", free: " + lot.freeSpots());
        try {
            lot.park("KA05", Size.TRUCK);
        } catch (IllegalStateException e) {
            System.out.println(e.getMessage());
        }
        System.out.println("Fee for " + t1 + ": " + lot.leave(t1, 3));
        System.out.println("Fee for " + t2 + ": " + lot.leave(t2, 0));
        try {
            lot.park("KA06", Size.TRUCK);
        } catch (IllegalStateException e) {
            System.out.println("Still no spot for the truck");
        }
        System.out.println("Free spots: " + lot.freeSpots());
    }
}
```

In an interview, the follow-ups are where you score: a smarter allocation strategy (fill car spots before truck spots, so trucks aren't blocked: a second strategy interface), multiple floors, and two cars racing for the last spot at the same moment (`synchronized park`, Day 39). The design already has the hooks: allocation lives in one method, and fees are a swappable strategy.
