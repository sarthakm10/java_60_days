Today the roles are reversed: the production code is given and **you write the tests**. Each starter test method just calls `fail("TODO")` — replace them with real tests until the class is green. One exercise hides a bug that a good parameterised test will expose.

**Dependencies:** Spring Web + the web test starter from Day 20 (JUnit 5, Mockito, AssertJ and MockMvc all come with it). On Boot 3.4+ `@MockitoBean` replaces the deprecated `@MockBean`.

<!-- exercise: d24_e1 | Medium | Unit-test a service with Mockito -->
**Concepts:** `@ExtendWith(MockitoExtension.class)` · `@Mock` / `@InjectMocks` / `@Captor` · `when(...).thenReturn(...)` / `thenThrow` · `verify`, `never()`, `verifyNoInteractions` · `ArgumentCaptor` · `InOrder` · Arrange–Act–Assert

**Task.** `OrderService.placeOrder` charges a card, saves the order, and emails a confirmation. Write **five** tests that pin down its behaviour:

1. A successful payment saves a `PAID` order with the payment's transaction id, and emails `"Order 7 confirmed"`.
2. A declined payment saves a `DECLINED` order, throws `PaymentDeclinedException`, and sends **no** email.
3. An amount ≤ 0 throws `IllegalArgumentException` and touches **no** collaborator.
4. A payment timeout (the client throws) propagates and **nothing** is saved.
5. The card is charged **before** the order is saved (use `InOrder`).

**Starter code**

```java
// src/main/java/com/example/practice/d24/orders/OrderService.java
package com.example.practice.d24.orders;

import java.math.BigDecimal;

public class OrderService {
    public record Order(Long id, String customer, BigDecimal amount, String status, String paymentId) { }
    public record PaymentResult(boolean approved, String transactionId) { }
    public interface OrderRepository { Order save(Order order); }
    public interface PaymentClient { PaymentResult charge(String customer, BigDecimal amount); }
    public interface EmailSender { void send(String to, String body); }
    public static class PaymentDeclinedException extends RuntimeException {
        public PaymentDeclinedException(String customer) { super("payment declined for " + customer); }
    }

    private final OrderRepository repository;
    private final PaymentClient payments;
    private final EmailSender email;

    public OrderService(OrderRepository repository, PaymentClient payments, EmailSender email) {
        this.repository = repository;
        this.payments = payments;
        this.email = email;
    }

    public Order placeOrder(String customer, BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("amount must be positive");
        PaymentResult payment = payments.charge(customer, amount);
        if (!payment.approved()) {
            repository.save(new Order(null, customer, amount, "DECLINED", null));
            throw new PaymentDeclinedException(customer);
        }
        Order saved = repository.save(new Order(null, customer, amount, "PAID", payment.transactionId()));
        email.send(customer, "Order " + saved.id() + " confirmed");
        return saved;
    }
}
```

```java
// src/test/java/com/example/practice/d24/orders/OrderServiceTest.java
package com.example.practice.d24.orders;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.fail;

class OrderServiceTest {
    // TODO: MockitoExtension, @Mock collaborators, @InjectMocks OrderService, @Captor for Order

    @Test void paidOrderIsSavedAndConfirmed() { fail("TODO"); }
    @Test void declinedPaymentSavesDeclinedOrderAndSendsNoEmail() { fail("TODO"); }
    @Test void invalidAmountTouchesNoCollaborator() { fail("TODO"); }
    @Test void paymentTimeoutPropagatesAndNothingIsSaved() { fail("TODO"); }
    @Test void cardIsChargedBeforeTheOrderIsSaved() { fail("TODO"); }
}
```

**Expected result**

```text
OrderServiceTest: 5 tests passed
```

<!-- hints -->
- Class setup: `@ExtendWith(MockitoExtension.class)`, `@Mock OrderRepository repository;` (and the other two), `@InjectMocks OrderService service;`, `@Captor ArgumentCaptor<Order> orderCaptor;`.
- Stub the save to return an order with an id: `when(repository.save(any())).thenAnswer(inv -> { Order o = inv.getArgument(0); return new Order(7L, o.customer(), o.amount(), o.status(), o.paymentId()); });`
- `verify(repository).save(orderCaptor.capture());` then assert on `orderCaptor.getValue().status()`.
- `verifyNoInteractions(email)`, `verify(repository, never()).save(any())`, and `InOrder inOrder = inOrder(payments, repository); inOrder.verify(payments).charge(...); inOrder.verify(repository).save(any());`.
- Mockito's strict stubs fail a test that stubs something it never uses (`UnnecessaryStubbingException`) — keep each test's stubbing minimal.

<!-- solution -->
```java
// src/test/java/com/example/practice/d24/orders/OrderServiceTest.java
package com.example.practice.d24.orders;

import com.example.practice.d24.orders.OrderService.EmailSender;
import com.example.practice.d24.orders.OrderService.Order;
import com.example.practice.d24.orders.OrderService.OrderRepository;
import com.example.practice.d24.orders.OrderService.PaymentClient;
import com.example.practice.d24.orders.OrderService.PaymentDeclinedException;
import com.example.practice.d24.orders.OrderService.PaymentResult;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository repository;
    @Mock PaymentClient payments;
    @Mock EmailSender email;
    @InjectMocks OrderService service;                 // built with the three mocks via its constructor
    @Captor ArgumentCaptor<Order> orderCaptor;

    final BigDecimal amount = new BigDecimal("499.00");

    void saveAssignsId7() {
        when(repository.save(any())).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            return new Order(7L, o.customer(), o.amount(), o.status(), o.paymentId());
        });
    }

    @Test
    void paidOrderIsSavedAndConfirmed() {
        // Arrange
        when(payments.charge("asha", amount)).thenReturn(new PaymentResult(true, "txn-42"));
        saveAssignsId7();
        // Act
        Order result = service.placeOrder("asha", amount);
        // Assert
        verify(repository).save(orderCaptor.capture());
        assertThat(orderCaptor.getValue().status()).isEqualTo("PAID");
        assertThat(orderCaptor.getValue().paymentId()).isEqualTo("txn-42");
        assertThat(result.id()).isEqualTo(7L);
        verify(email).send("asha", "Order 7 confirmed");
    }

    @Test
    void declinedPaymentSavesDeclinedOrderAndSendsNoEmail() {
        when(payments.charge("asha", amount)).thenReturn(new PaymentResult(false, null));

        assertThatThrownBy(() -> service.placeOrder("asha", amount)).isInstanceOf(PaymentDeclinedException.class);

        verify(repository).save(orderCaptor.capture());
        assertThat(orderCaptor.getValue().status()).isEqualTo("DECLINED");
        verifyNoInteractions(email);
    }

    @Test
    void invalidAmountTouchesNoCollaborator() {
        assertThatThrownBy(() -> service.placeOrder("asha", BigDecimal.ZERO)).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(payments, repository, email);
    }

    @Test
    void paymentTimeoutPropagatesAndNothingIsSaved() {
        when(payments.charge("asha", amount)).thenThrow(new IllegalStateException("gateway timeout"));

        assertThatThrownBy(() -> service.placeOrder("asha", amount)).hasMessage("gateway timeout");

        verify(repository, never()).save(any());
        verifyNoInteractions(email);
    }

    @Test
    void cardIsChargedBeforeTheOrderIsSaved() {
        when(payments.charge("asha", amount)).thenReturn(new PaymentResult(true, "txn-1"));
        saveAssignsId7();

        service.placeOrder("asha", amount);

        InOrder inOrder = inOrder(payments, repository, email);
        inOrder.verify(payments).charge("asha", amount);
        inOrder.verify(repository).save(any());
        inOrder.verify(email).send("asha", "Order 7 confirmed");
    }
}
```

**What makes a good unit test.** One behaviour per test, named after the behaviour; Arrange–Act–Assert blocks; mock only **collaborators** (never the class under test, never value objects); verify outcomes and important interactions, not every call. If a test needs ten mocks, the class probably has too many responsibilities.

<!-- exercise: d24_e2 | Medium | Parameterised tests that catch a real bug -->
**Concepts:** `@ParameterizedTest` · `@CsvSource` tables · `@ValueSource` · `@NullAndEmptySource` · `assertThrows` / `assertThatThrownBy` · writing tests from a **spec**, not from the code

**Task.** Write tests for `ShippingCalculator` from this specification, then fix whatever bug your tests reveal:

- Base price by zone: `LOCAL` 40, `NATIONAL` 80, `INTERNATIONAL` 500.
- The first kg is included; every **started** kg above 1 kg adds 20 (2.5 kg → 2 extra kg → +40).
- Express shipping **doubles** the total.
- Weight must be > 0 and ≤ 30 kg; zone must be one of the three — otherwise `IllegalArgumentException`.

Your test class must contain exactly: a 6-row `@CsvSource` table, 3 invalid weights, 3 invalid zones (`null`, `""`, `"MARS"`) and one express test — **13 tests** in total.

**Starter code**

```java
// src/main/java/com/example/practice/d24/shipping/ShippingCalculator.java
package com.example.practice.d24.shipping;

public class ShippingCalculator {

    public double cost(double weightKg, String zone, boolean express) {
        if (weightKg <= 0 || weightKg > 30) throw new IllegalArgumentException("weight out of range: " + weightKg);
        if (zone == null || zone.isBlank()) throw new IllegalArgumentException("zone is required");
        double base = switch (zone) {
            case "LOCAL" -> 40;
            case "NATIONAL" -> 80;
            case "INTERNATIONAL" -> 500;
            default -> throw new IllegalArgumentException("unknown zone " + zone);
        };
        double extraKg = Math.max(0, Math.floor(weightKg - 1));
        double total = base + extraKg * 20;
        return express ? total * 2 : total;
    }
}
```

```java
// src/test/java/com/example/practice/d24/shipping/ShippingCalculatorTest.java
package com.example.practice.d24.shipping;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.fail;

class ShippingCalculatorTest {
    // TODO: replace with a @ParameterizedTest @CsvSource table (6 rows), invalid weights (3), invalid zones (3)

    @Test void costTable() { fail("TODO"); }
    @Test void expressDoublesTheTotal() { fail("TODO"); }
}
```

**Expected result**

```text
ShippingCalculatorTest: 13 tests passed
```

<!-- hints -->
- `@ParameterizedTest(name = "{0} kg {1} → {2}") @CsvSource({ "1.0, LOCAL, 40", "2.5, LOCAL, 80", ... })` — each row becomes its own test case with a readable name.
- Pick rows at the **boundaries** the spec mentions: exactly 1 kg, a fraction just above an integer (1.1 kg), a fraction like 2.5, exactly 30 kg.
- `@ParameterizedTest @ValueSource(doubles = {0, -1, 30.5})` for weights; `@ParameterizedTest @NullAndEmptySource @ValueSource(strings = "MARS")` for zones.
- If your 1.1 kg and 2.5 kg rows fail (40 instead of 60, 60 instead of 80), the calculator rounds the extra weight **down**. "Every started kg" means rounding **up** — `Math.ceil`.
- This is why tests should come from the requirements: a test copied from the implementation would have "agreed" with the bug.

<!-- solution -->
```java
// src/main/java/com/example/practice/d24/shipping/ShippingCalculator.java
package com.example.practice.d24.shipping;

public class ShippingCalculator {

    public double cost(double weightKg, String zone, boolean express) {
        if (weightKg <= 0 || weightKg > 30) throw new IllegalArgumentException("weight out of range: " + weightKg);
        if (zone == null || zone.isBlank()) throw new IllegalArgumentException("zone is required");
        double base = switch (zone) {
            case "LOCAL" -> 40;
            case "NATIONAL" -> 80;
            case "INTERNATIONAL" -> 500;
            default -> throw new IllegalArgumentException("unknown zone " + zone);
        };
        double extraKg = Math.max(0, Math.ceil(weightKg - 1));     // BUG FIX: every *started* kg counts
        double total = base + extraKg * 20;
        return express ? total * 2 : total;
    }
}
```

```java
// src/test/java/com/example/practice/d24/shipping/ShippingCalculatorTest.java
package com.example.practice.d24.shipping;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ShippingCalculatorTest {

    final ShippingCalculator calculator = new ShippingCalculator();

    @ParameterizedTest(name = "{0} kg {1} -> {2}")
    @CsvSource({
            "1.0,  LOCAL,         40",     // first kg included
            "1.1,  LOCAL,         60",     // a started extra kg counts   (fails on the buggy version)
            "2.5,  LOCAL,         80",     // 1.5 extra → 2 started kg   (fails on the buggy version)
            "3.0,  NATIONAL,      120",
            "0.2,  INTERNATIONAL, 500",
            "30.0, INTERNATIONAL, 1080"    // upper boundary: 29 extra kg
    })
    void costTable(double weight, String zone, double expected) {
        assertThat(calculator.cost(weight, zone, false)).isEqualTo(expected);
    }

    @ParameterizedTest
    @ValueSource(doubles = {0, -1, 30.5})
    void invalidWeightsAreRejected(double weight) {
        assertThatThrownBy(() -> calculator.cost(weight, "LOCAL", false)).isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "MARS")
    void invalidZonesAreRejected(String zone) {
        assertThatThrownBy(() -> calculator.cost(1, zone, false)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void expressDoublesTheTotal() {
        assertThat(calculator.cost(2.5, "NATIONAL", true)).isEqualTo(2 * calculator.cost(2.5, "NATIONAL", false));
    }
}
```

**Boundary-value thinking** is the habit that finds bugs: test exactly at, just below and just above every limit in the spec (0, 1, 1.1, 30, 30.5). One parameterised table documents all of them better than a dozen copy-pasted tests.

<!-- exercise: d24_e3 | Medium | Slice-test a controller with `@WebMvcTest` and `@MockitoBean` -->
**Concepts:** `@WebMvcTest` loads only the web layer · `@MockitoBean` replaces a bean in the Spring context · `MockMvc` `perform` / `andExpect` / `jsonPath` · verifying the service call with an `ArgumentCaptor` · error mapping to 404 and 409

**Task.** `ProductController` is finished. Write a slice test with the service mocked:

1. `GET /api/products/{sku}` returns 200 with the product JSON when found.
2. … and 404 when the service returns empty.
3. `POST /api/products` returns 201, and the service receives the right `Product` (capture it).
4. A duplicate SKU (the service throws `DuplicateSkuException`) returns **409** with the message in the body.

**Starter code**

```java
// src/main/java/com/example/practice/d24/products/Product.java
package com.example.practice.d24.products;

public record Product(String sku, String name, int priceInPaise) { }
```

```java
// src/main/java/com/example/practice/d24/products/ProductService.java
package com.example.practice.d24.products;

import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ProductService {
    public static class DuplicateSkuException extends RuntimeException {
        public DuplicateSkuException(String sku) { super("SKU already exists: " + sku); }
    }

    public Optional<Product> find(String sku) { throw new UnsupportedOperationException("talks to the database"); }
    public Product create(Product product) { throw new UnsupportedOperationException("talks to the database"); }
}
```

```java
// src/main/java/com/example/practice/d24/products/ProductController.java
package com.example.practice.d24.products;

import com.example.practice.d24.products.ProductService.DuplicateSkuException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;

    public ProductController(ProductService service) { this.service = service; }

    @GetMapping("/{sku}")
    public ResponseEntity<Product> get(@PathVariable String sku) {
        return service.find(sku).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@RequestBody Product product) { return service.create(product); }

    @ExceptionHandler(DuplicateSkuException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public String duplicate(DuplicateSkuException e) { return e.getMessage(); }
}
```

```java
// src/test/java/com/example/practice/d24/products/ProductControllerTest.java
package com.example.practice.d24.products;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.fail;

class ProductControllerTest {
    // TODO: @WebMvcTest(ProductController.class), MockMvc, @MockitoBean ProductService

    @Test void existingProductReturns200() { fail("TODO"); }
    @Test void missingProductReturns404() { fail("TODO"); }
    @Test void createReturns201AndPassesTheProductToTheService() { fail("TODO"); }
    @Test void duplicateSkuReturns409() { fail("TODO"); }
}
```

**Expected result**

```text
ProductControllerTest: 4 tests passed
```

<!-- hints -->
- `@MockitoBean ProductService service;` (`org.springframework.test.context.bean.override.mockito.MockitoBean`) puts a Mockito mock into the context **in place of** the real bean — the real one would throw.
- `when(service.find("SKU-1")).thenReturn(Optional.of(new Product("SKU-1", "Pen", 4900)));` then `mvc.perform(get("/api/products/SKU-1")).andExpect(jsonPath("$.name").value("Pen"))`.
- For POST, stub `when(service.create(any())).thenAnswer(inv -> inv.getArgument(0));`, then `verify(service).create(captor.capture())` and check its fields.
- `when(service.create(any())).thenThrow(new DuplicateSkuException("SKU-1"))` → expect `status().isConflict()` and `content().string("SKU already exists: SKU-1")`.
- `@WebMvcTest` boots in about a second because it skips services, repositories and the database — use `@SpringBootTest` (with Testcontainers for a real Postgres) only for the few end-to-end tests.

<!-- solution -->
```java
// src/test/java/com/example/practice/d24/products/ProductControllerTest.java
package com.example.practice.d24.products;

import com.example.practice.d24.products.ProductService.DuplicateSkuException;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean ProductService service;                    // replaces the real bean in this context

    @Test
    void existingProductReturns200() throws Exception {
        when(service.find("SKU-1")).thenReturn(Optional.of(new Product("SKU-1", "Pen", 4900)));

        mvc.perform(get("/api/products/SKU-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Pen"))
                .andExpect(jsonPath("$.priceInPaise").value(4900));
    }

    @Test
    void missingProductReturns404() throws Exception {
        when(service.find("NOPE")).thenReturn(Optional.empty());
        mvc.perform(get("/api/products/NOPE")).andExpect(status().isNotFound());
    }

    @Test
    void createReturns201AndPassesTheProductToTheService() throws Exception {
        when(service.create(any())).thenAnswer(inv -> inv.getArgument(0));

        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"SKU-2\",\"name\":\"Notebook\",\"priceInPaise\":12000}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").value("SKU-2"));

        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(service).create(captor.capture());
        assertThat(captor.getValue()).isEqualTo(new Product("SKU-2", "Notebook", 12000));
    }

    @Test
    void duplicateSkuReturns409() throws Exception {
        when(service.create(any())).thenThrow(new DuplicateSkuException("SKU-1"));

        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"SKU-1\",\"name\":\"Pen\",\"priceInPaise\":4900}"))
                .andExpect(status().isConflict())
                .andExpect(content().string("SKU already exists: SKU-1"));
    }
}
```

**Picking the test type.** Plain unit test with Mockito — business logic (milliseconds). `@WebMvcTest` — URLs, JSON, status codes, validation, security rules (about a second). `@DataJpaTest` — queries and mappings. `@SpringBootTest` + Testcontainers — a handful of end-to-end flows against real Postgres/Kafka in Docker. Keep the pyramid: many fast tests at the bottom, few slow ones at the top.
