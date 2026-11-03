Two algorithms that come up in system design interviews, small enough to write in a few minutes: consistent hashing and a token-bucket rate limiter. Time is simulated, so the output is the same on every run.

<!-- exercise: b93_e1 | Medium | Consistent hashing vs modulo, and a token bucket -->
**Concepts:** a hash ring with a `TreeMap` · virtual nodes · counting how many keys move when a server is added · token bucket refills

**Task.**

1. `ModuloRouter.serverFor(key)` picks `servers[floorMod(hash, n)]`. `HashRing` places each server at `vnodes` points on a ring (`hash(server + "#" + i)`) and sends a key to the first server point **at or after** the key's hash, wrapping around to the start.
2. Route 1000 keys to 4 servers, add a 5th server, and count how many keys **change server** with each approach.
3. `TokenBucket(capacity, refillPerSecond)` starts full; `tryAcquire(nowSeconds)` first adds the tokens earned since the last call (never above capacity), then takes one if available.

**Starter code** · `Scaling.java`

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class Scaling {
    // a deterministic hash (same numbers for everyone), with bit mixing so points spread around the ring
    static int hash(String s) {
        int h = 0;
        for (char c : s.toCharArray()) h = h * 31 + c;
        h ^= h >>> 16; h *= 0x85ebca6b; h ^= h >>> 13; h *= 0xc2b2ae35; h ^= h >>> 16;
        return h & 0x7fffffff;   // keep it non-negative
    }

    static class ModuloRouter {
        final List<String> servers;
        ModuloRouter(List<String> servers) { this.servers = servers; }
        String serverFor(String key) { return null; }   // TODO
    }

    static class HashRing {
        final TreeMap<Integer, String> ring = new TreeMap<>();
        HashRing(List<String> servers, int vnodes) {
            // TODO: put each server at vnodes points: hash(server + "#" + i)
        }
        String serverFor(String key) { return null; }   // TODO: ceilingEntry, wrapping to firstEntry
    }

    static class TokenBucket {
        final int capacity;
        final double refillPerSecond;
        double tokens;
        double last = 0;
        TokenBucket(int capacity, double refillPerSecond) {
            this.capacity = capacity;
            this.refillPerSecond = refillPerSecond;
            this.tokens = capacity;
        }
        boolean tryAcquire(double nowSeconds) {
            return false; // TODO: refill, then take a token if there is one
        }
    }

    static int moved(List<String> keys, java.util.function.Function<String, String> before,
                     java.util.function.Function<String, String> after) {
        int count = 0;
        for (String k : keys) if (!before.apply(k).equals(after.apply(k))) count++;
        return count;
    }

    public static void main(String[] args) {
        List<String> keys = new ArrayList<>();
        for (int i = 0; i < 1000; i++) keys.add("user-" + i);
        List<String> four = List.of("s1", "s2", "s3", "s4");
        List<String> five = List.of("s1", "s2", "s3", "s4", "s5");

        ModuloRouter m4 = new ModuloRouter(four), m5 = new ModuloRouter(five);
        HashRing r4 = new HashRing(four, 100), r5 = new HashRing(five, 100);
        System.out.println("modulo: " + moved(keys, m4::serverFor, m5::serverFor) + " of 1000 keys moved");
        System.out.println("ring:   " + moved(keys, r4::serverFor, r5::serverFor) + " of 1000 keys moved");

        TokenBucket bucket = new TokenBucket(3, 1.0);   // burst of 3, then 1 request per second
        double[] times = {0, 0, 0, 0, 0.5, 1.0, 1.0, 3.0, 3.0, 3.0};
        StringBuilder sb = new StringBuilder();
        for (double t : times) sb.append(bucket.tryAcquire(t) ? "Y" : "n");
        System.out.println("requests: " + sb);
    }
}
```

**Expected output**

```text
modulo: 789 of 1000 keys moved
ring:   177 of 1000 keys moved
requests: YYYnnYnYYn
```

<!-- hints -->
- Modulo: `servers.get(Math.floorMod(hash(key), servers.size()))`.
- Ring constructor: `for (String s : servers) for (int i = 0; i < vnodes; i++) ring.put(hash(s + "#" + i), s);`
- Ring lookup: `Map.Entry<Integer, String> e = ring.ceilingEntry(hash(key)); return (e != null ? e : ring.firstEntry()).getValue();` (`ceilingEntry` is Day 31's TreeMap navigation).
- Token bucket: `tokens = Math.min(capacity, tokens + (now - last) * refillPerSecond); last = now; if (tokens >= 1) { tokens -= 1; return true; } return false;`
- Ideally only about 1 in 5 keys should move when a 5th server joins (they move to the new server). Compare that with the modulo result.

<!-- solution -->
```java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class Scaling {
    static int hash(String s) {
        int h = 0;
        for (char c : s.toCharArray()) h = h * 31 + c;
        h ^= h >>> 16; h *= 0x85ebca6b; h ^= h >>> 13; h *= 0xc2b2ae35; h ^= h >>> 16;   // mix the bits
        return h & 0x7fffffff;
    }

    static class ModuloRouter {
        final List<String> servers;
        ModuloRouter(List<String> servers) { this.servers = servers; }
        String serverFor(String key) {
            return servers.get(Math.floorMod(hash(key), servers.size()));
        }
    }

    static class HashRing {
        final TreeMap<Integer, String> ring = new TreeMap<>();
        HashRing(List<String> servers, int vnodes) {
            for (String s : servers) {
                for (int i = 0; i < vnodes; i++) {
                    ring.put(hash(s + "#" + i), s);
                }
            }
        }
        String serverFor(String key) {
            Map.Entry<Integer, String> e = ring.ceilingEntry(hash(key));
            return (e != null ? e : ring.firstEntry()).getValue();   // past the last point: wrap around
        }
    }

    static class TokenBucket {
        final int capacity;
        final double refillPerSecond;
        double tokens;
        double last = 0;
        TokenBucket(int capacity, double refillPerSecond) {
            this.capacity = capacity;
            this.refillPerSecond = refillPerSecond;
            this.tokens = capacity;
        }
        boolean tryAcquire(double nowSeconds) {
            tokens = Math.min(capacity, tokens + (nowSeconds - last) * refillPerSecond);
            last = nowSeconds;
            if (tokens >= 1) {
                tokens -= 1;
                return true;
            }
            return false;
        }
    }

    static int moved(List<String> keys, java.util.function.Function<String, String> before,
                     java.util.function.Function<String, String> after) {
        int count = 0;
        for (String k : keys) if (!before.apply(k).equals(after.apply(k))) count++;
        return count;
    }

    public static void main(String[] args) {
        List<String> keys = new ArrayList<>();
        for (int i = 0; i < 1000; i++) keys.add("user-" + i);
        List<String> four = List.of("s1", "s2", "s3", "s4");
        List<String> five = List.of("s1", "s2", "s3", "s4", "s5");

        ModuloRouter m4 = new ModuloRouter(four), m5 = new ModuloRouter(five);
        HashRing r4 = new HashRing(four, 100), r5 = new HashRing(five, 100);
        System.out.println("modulo: " + moved(keys, m4::serverFor, m5::serverFor) + " of 1000 keys moved");
        System.out.println("ring:   " + moved(keys, r4::serverFor, r5::serverFor) + " of 1000 keys moved");

        TokenBucket bucket = new TokenBucket(3, 1.0);
        double[] times = {0, 0, 0, 0, 0.5, 1.0, 1.0, 3.0, 3.0, 3.0};
        StringBuilder sb = new StringBuilder();
        for (double t : times) sb.append(bucket.tryAcquire(t) ? "Y" : "n");
        System.out.println("requests: " + sb);
    }
}
```

With modulo hashing, adding one server reshuffles most keys: for a cache cluster, that means most of the cache suddenly misses and the database takes the full load. On the ring, roughly only the keys now owned by the new server move. The token bucket lets the first 3 requests through in a burst, then allows about one per second as tokens refill (Day 93's rate limiting).
