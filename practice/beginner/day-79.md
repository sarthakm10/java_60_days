A tiny in-memory "Kafka" in about 60 lines. It's nothing like the real thing internally, but it makes topics, partitions, keys, offsets and consumer groups concrete.

<!-- exercise: b79_e1 | Medium | A mini Kafka: partitions, offsets and consumer groups -->
**Concepts:** an append-only log per partition · choosing a partition from the key · per-group offsets · partition assignment within a group

**Task.** Complete `MiniKafka`:

- `send(key, value)` appends `key:value` to partition `Math.floorMod(key.hashCode(), partitions)` and returns that partition. Same key → same partition → events stay in order.
- `poll(group, partition)` returns every event in that partition **after the group's committed offset**, then commits (moves the offset to the end). Each group has its own offsets, so every group sees every event once.
- `assign(consumers)` spreads the partitions over a group's consumers round-robin: consumer `i` gets partitions `i, i + consumers, …`. With more consumers than partitions, some get nothing.

**Starter code** · `MiniKafka.java`

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MiniKafka {
    private final List<List<String>> partitions = new ArrayList<>();
    private final Map<String, int[]> committed = new HashMap<>();   // group -> offset per partition

    MiniKafka(int partitionCount) {
        for (int i = 0; i < partitionCount; i++) {
            partitions.add(new ArrayList<>());
        }
    }

    int send(String key, String value) {
        return 0; // TODO
    }

    List<String> poll(String group, int partition) {
        return List.of(); // TODO
    }

    List<List<Integer>> assign(int consumers) {
        return List.of(); // TODO
    }

    public static void main(String[] args) {
        MiniKafka orders = new MiniKafka(3);
        String[][] events = {
            {"order-1", "placed"}, {"order-2", "placed"}, {"order-1", "paid"},
            {"order-3", "placed"}, {"order-1", "shipped"}, {"order-2", "cancelled"}
        };
        for (String[] e : events) {
            int p = orders.send(e[0], e[1]);
            System.out.println(e[0] + ":" + e[1] + " -> partition " + p);
        }
        for (int p = 0; p < 3; p++) {
            System.out.println("partition " + p + ": " + orders.partitions.get(p));
        }

        int emailCount = 0, analyticsCount = 0;
        for (int p = 0; p < 3; p++) {
            emailCount += orders.poll("email", p).size();
            analyticsCount += orders.poll("analytics", p).size();
        }
        System.out.println("email read " + emailCount + ", analytics read " + analyticsCount);

        int p = orders.send("order-3", "paid");
        System.out.println("email polls partition " + p + " again: " + orders.poll("email", p));
        System.out.println("and again: " + orders.poll("email", p));

        System.out.println("2 consumers: " + orders.assign(2));
        System.out.println("4 consumers: " + orders.assign(4));
    }
}
```

**Expected output**

```text
order-1:placed -> partition 1
order-2:placed -> partition 2
order-1:paid -> partition 1
order-3:placed -> partition 0
order-1:shipped -> partition 1
order-2:cancelled -> partition 2
partition 0: [order-3:placed]
partition 1: [order-1:placed, order-1:paid, order-1:shipped]
partition 2: [order-2:placed, order-2:cancelled]
email read 6, analytics read 6
email polls partition 0 again: [order-3:paid]
and again: []
2 consumers: [[0, 2], [1]]
4 consumers: [[0], [1], [2], []]
```

<!-- hints -->
- `send`: `int p = Math.floorMod(key.hashCode(), partitions.size()); partitions.get(p).add(key + ":" + value); return p;` (`floorMod` stays non-negative even for negative hash codes).
- `poll`: `int[] offsets = committed.computeIfAbsent(group, g -> new int[partitions.size()]);` then return `new ArrayList<>(log.subList(offsets[partition], log.size()))` and set `offsets[partition] = log.size()`.
- `assign`: create `consumers` empty lists, then put partition `p` into list `p % consumers`.
- Notice every `order-1` event lands in the same partition, in order: that's the guarantee Kafka gives per key.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MiniKafka {
    private final List<List<String>> partitions = new ArrayList<>();
    private final Map<String, int[]> committed = new HashMap<>();

    MiniKafka(int partitionCount) {
        for (int i = 0; i < partitionCount; i++) {
            partitions.add(new ArrayList<>());
        }
    }

    int send(String key, String value) {
        int p = Math.floorMod(key.hashCode(), partitions.size());
        partitions.get(p).add(key + ":" + value);   // append only: nothing is ever changed in place
        return p;
    }

    List<String> poll(String group, int partition) {
        int[] offsets = committed.computeIfAbsent(group, g -> new int[partitions.size()]);
        List<String> log = partitions.get(partition);
        List<String> fresh = new ArrayList<>(log.subList(offsets[partition], log.size()));
        offsets[partition] = log.size();            // commit: this group has read up to here
        return fresh;
    }

    List<List<Integer>> assign(int consumers) {
        List<List<Integer>> assignment = new ArrayList<>();
        for (int c = 0; c < consumers; c++) {
            assignment.add(new ArrayList<>());
        }
        for (int p = 0; p < partitions.size(); p++) {
            assignment.get(p % consumers).add(p);
        }
        return assignment;
    }

    public static void main(String[] args) {
        MiniKafka orders = new MiniKafka(3);
        String[][] events = {
            {"order-1", "placed"}, {"order-2", "placed"}, {"order-1", "paid"},
            {"order-3", "placed"}, {"order-1", "shipped"}, {"order-2", "cancelled"}
        };
        for (String[] e : events) {
            int p = orders.send(e[0], e[1]);
            System.out.println(e[0] + ":" + e[1] + " -> partition " + p);
        }
        for (int p = 0; p < 3; p++) {
            System.out.println("partition " + p + ": " + orders.partitions.get(p));
        }

        int emailCount = 0, analyticsCount = 0;
        for (int p = 0; p < 3; p++) {
            emailCount += orders.poll("email", p).size();
            analyticsCount += orders.poll("analytics", p).size();
        }
        System.out.println("email read " + emailCount + ", analytics read " + analyticsCount);

        int p = orders.send("order-3", "paid");
        System.out.println("email polls partition " + p + " again: " + orders.poll("email", p));
        System.out.println("and again: " + orders.poll("email", p));

        System.out.println("2 consumers: " + orders.assign(2));
        System.out.println("4 consumers: " + orders.assign(4));
    }
}
```

Both groups read all six events independently, because offsets are kept per group. The second poll returns only the new event, and the third returns nothing: the offset remembers where the group stopped. With 4 consumers and 3 partitions, one consumer gets an empty list: exactly why adding consumers beyond the partition count doesn't help (Day 79).
