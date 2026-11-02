HTTP is just text with a fixed shape. Before Spring Boot does it for you, read a raw request yourself.

<!-- exercise: b45_e1 | Medium | Parse a raw HTTP request -->
**Concepts:** HTTP request format · `split` and `indexOf` · `Map` for headers and query parameters · records

**Task.** Complete `parse(String raw)` so it turns the raw request text into an `HttpRequest` record: the method, the path **without** the query string, the query parameters, the headers (names lower-cased, so lookups are case-insensitive) and the body. Lines are separated by `\n`, and an empty line separates the headers from the body.

**Starter code** · `RequestParser.java`

```java
import java.util.LinkedHashMap;
import java.util.Map;

public class RequestParser {
    record HttpRequest(String method, String path, Map<String, String> query,
                       Map<String, String> headers, String body) { }

    static HttpRequest parse(String raw) {
        // TODO 1: split head and body at the first empty line ("\n\n")
        // TODO 2: the first line is "METHOD TARGET VERSION"; split the target at "?" into path and query
        // TODO 3: query "a=1&b=2" -> map; header lines "Name: value" -> map with lower-case names
        return new HttpRequest("", "", new LinkedHashMap<>(), new LinkedHashMap<>(), "");
    }

    public static void main(String[] args) {
        String raw = "POST /api/orders?currency=INR&express=true HTTP/1.1\n"
                + "Host: shop.example.com\n"
                + "Content-Type: application/json\n"
                + "Authorization: Bearer abc.def.ghi\n"
                + "\n"
                + "{\"productId\": 42, \"quantity\": 2}";
        HttpRequest r = parse(raw);
        System.out.println(r.method() + " " + r.path());
        System.out.println("query: " + r.query());
        System.out.println("content type: " + r.headers().get("content-type"));
        System.out.println("auth: " + r.headers().get("authorization"));
        System.out.println("body: " + r.body());

        HttpRequest g = parse("GET /products/7 HTTP/1.1\nHost: shop.example.com\n\n");
        System.out.println(g.method() + " " + g.path() + " query=" + g.query() + " body='" + g.body() + "'");
    }
}
```

**Expected output**

```text
POST /api/orders
query: {currency=INR, express=true}
content type: application/json
auth: Bearer abc.def.ghi
body: {"productId": 42, "quantity": 2}
GET /products/7 query={} body=''
```

<!-- hints -->
- `int split = raw.indexOf("\n\n");` The head is `raw.substring(0, split)` and the body `raw.substring(split + 2)` (or empty if there's no blank line).
- `String[] lines = head.split("\n");` then `lines[0].split(" ")` gives method, target and version.
- For the target, `int q = target.indexOf('?');` If it's `-1`, there's no query string.
- For a header line, split only at the **first** `": "`: `line.indexOf(": ")`. Header values (like the token) may contain other characters.
- Use `LinkedHashMap` so the query parameters print in their original order.

<!-- solution -->
```java
import java.util.LinkedHashMap;
import java.util.Map;

public class RequestParser {
    record HttpRequest(String method, String path, Map<String, String> query,
                       Map<String, String> headers, String body) { }

    static HttpRequest parse(String raw) {
        int split = raw.indexOf("\n\n");
        String head = split >= 0 ? raw.substring(0, split) : raw;
        String body = split >= 0 ? raw.substring(split + 2) : "";

        String[] lines = head.split("\n");
        String[] requestLine = lines[0].split(" ");
        String method = requestLine[0];
        String target = requestLine[1];

        String path = target;
        Map<String, String> query = new LinkedHashMap<>();
        int q = target.indexOf('?');
        if (q >= 0) {
            path = target.substring(0, q);
            for (String pair : target.substring(q + 1).split("&")) {
                int eq = pair.indexOf('=');
                if (eq > 0) {
                    query.put(pair.substring(0, eq), pair.substring(eq + 1));
                }
            }
        }

        Map<String, String> headers = new LinkedHashMap<>();
        for (int i = 1; i < lines.length; i++) {
            int colon = lines[i].indexOf(": ");
            if (colon > 0) {
                headers.put(lines[i].substring(0, colon).toLowerCase(), lines[i].substring(colon + 2));
            }
        }
        return new HttpRequest(method, path, query, headers, body);
    }

    public static void main(String[] args) {
        String raw = "POST /api/orders?currency=INR&express=true HTTP/1.1\n"
                + "Host: shop.example.com\n"
                + "Content-Type: application/json\n"
                + "Authorization: Bearer abc.def.ghi\n"
                + "\n"
                + "{\"productId\": 42, \"quantity\": 2}";
        HttpRequest r = parse(raw);
        System.out.println(r.method() + " " + r.path());
        System.out.println("query: " + r.query());
        System.out.println("content type: " + r.headers().get("content-type"));
        System.out.println("auth: " + r.headers().get("authorization"));
        System.out.println("body: " + r.body());

        HttpRequest g = parse("GET /products/7 HTTP/1.1\nHost: shop.example.com\n\n");
        System.out.println(g.method() + " " + g.path() + " query=" + g.query() + " body='" + g.body() + "'");
    }
}
```

This is (a very small part of) what Tomcat does for every request before your Spring controller runs. Real servers also handle `\r\n` line endings, URL decoding (`%20` means a space) and repeated headers, which is why you'll never write this in production, but now `@RequestParam`, `@RequestHeader` and `@RequestBody` (Day 55) will feel familiar: they're these three maps and the body.
