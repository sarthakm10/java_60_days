`@Transactional` is the most misunderstood annotation in Spring interviews. Today you'll **see** every transaction begin, commit and roll back — using a tiny recording transaction manager instead of a database — and then use optimistic locking on real JPA entities.

**Dependencies:** same as Day 21 (Spring Data JPA + H2). Exercises 1 and 2 don't touch a database: they plug a `RecordingTransactionManager` (given below, in your **test** sources) into a small Spring context, so you can watch the transaction boundaries as text.

<!-- exercise: d22_e1 | Medium | Rollback rules, `readOnly` and the self-invocation trap -->
**Concepts:** `@Transactional` creates a proxy · default rollback only for unchecked exceptions · `rollbackFor` · `readOnly = true` · calling a `@Transactional` method from inside the same bean skips the proxy

**Task.** Annotate `OrderService` so the given test passes. You only add annotations and their attributes — no logic changes.

**Starter code**

```java
// src/test/java/com/example/practice/d22/RecordingTransactionManager.java
package com.example.practice.d22;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

/** Test helper: a transaction manager that records BEGIN / COMMIT / ROLLBACK instead of talking to a database. */
public class RecordingTransactionManager extends AbstractPlatformTransactionManager {
    private final List<String> events = new CopyOnWriteArrayList<>();
    private final ThreadLocal<Deque<String>> active = ThreadLocal.withInitial(ArrayDeque::new);
    private int counter;

    private static final class Tx { String id; }

    public List<String> events() { return List.copyOf(events); }
    public void reset() { events.clear(); counter = 0; }

    @Override protected Object doGetTransaction() { Tx tx = new Tx(); tx.id = active.get().peek(); return tx; }
    @Override protected boolean isExistingTransaction(Object tx) { return ((Tx) tx).id != null; }

    @Override
    protected void doBegin(Object tx, TransactionDefinition def) {
        String id = "tx" + (++counter);
        ((Tx) tx).id = id;
        active.get().push(id);
        events.add("BEGIN " + id + (def.isReadOnly() ? " readOnly" : ""));
    }

    @Override protected void doCommit(DefaultTransactionStatus s) { events.add("COMMIT " + ((Tx) s.getTransaction()).id); }
    @Override protected void doRollback(DefaultTransactionStatus s) { events.add("ROLLBACK " + ((Tx) s.getTransaction()).id); }
    @Override protected Object doSuspend(Object tx) { ((Tx) tx).id = null; return active.get().pop(); }
    @Override protected void doResume(Object tx, Object suspended) { active.get().push((String) suspended); }
    @Override protected void doCleanupAfterCompletion(Object tx) { active.get().pop(); }
}
```

```java
// src/main/java/com/example/practice/d22/rollback/InvoiceException.java
package com.example.practice.d22.rollback;

public class InvoiceException extends Exception {          // checked
    public InvoiceException(String message) { super(message); }
}
```

```java
// src/main/java/com/example/practice/d22/rollback/OrderService.java
package com.example.practice.d22.rollback;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    // TODO: transactional — a RuntimeException must roll back
    public void placeOrder(boolean fail) {
        if (fail) throw new IllegalStateException("payment declined");
    }

    // TODO: transactional with DEFAULT rules (watch what happens with a checked exception)
    public void invoiceWithDefaultRules() throws InvoiceException {
        throw new InvoiceException("PDF service down");
    }

    // TODO: transactional that rolls back for the checked exception too
    public void invoiceWithRollbackFor() throws InvoiceException {
        throw new InvoiceException("PDF service down");
    }

    // TODO: read-only transaction
    public List<String> findOrders() { return List.of("o-1", "o-2"); }

    // NOT transactional — calls placeOrder on 'this'
    public void importAll() {
        placeOrder(false);
        placeOrder(false);
    }
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d22/rollback/RollbackRulesTest.java
package com.example.practice.d22.rollback;

import com.example.practice.d22.RecordingTransactionManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringJUnitConfig(RollbackRulesTest.Config.class)
class RollbackRulesTest {

    @Configuration
    @EnableTransactionManagement
    @Import(OrderService.class)
    static class Config {
        @Bean RecordingTransactionManager transactionManager() { return new RecordingTransactionManager(); }
    }

    @Autowired OrderService orders;
    @Autowired RecordingTransactionManager tx;

    @BeforeEach
    void reset() { tx.reset(); }

    @Test
    void successCommits() {
        orders.placeOrder(false);
        assertThat(tx.events()).containsExactly("BEGIN tx1", "COMMIT tx1");
    }

    @Test
    void runtimeExceptionRollsBack() {
        assertThatThrownBy(() -> orders.placeOrder(true)).isInstanceOf(IllegalStateException.class);
        assertThat(tx.events()).containsExactly("BEGIN tx1", "ROLLBACK tx1");
    }

    @Test
    void checkedExceptionCommitsByDefault() {
        assertThatThrownBy(() -> orders.invoiceWithDefaultRules()).isInstanceOf(InvoiceException.class);
        assertThat(tx.events()).containsExactly("BEGIN tx1", "COMMIT tx1");
    }

    @Test
    void rollbackForCoversCheckedExceptions() {
        assertThatThrownBy(() -> orders.invoiceWithRollbackFor()).isInstanceOf(InvoiceException.class);
        assertThat(tx.events()).containsExactly("BEGIN tx1", "ROLLBACK tx1");
    }

    @Test
    void readOnlyFlagReachesTheTransactionManager() {
        assertThat(orders.findOrders()).hasSize(2);
        assertThat(tx.events()).containsExactly("BEGIN tx1 readOnly", "COMMIT tx1");
    }

    @Test
    void selfInvocationStartsNoTransaction() {
        orders.importAll();
        assertThat(tx.events()).isEmpty();
    }
}
```

**Expected result**

```text
RollbackRulesTest: 6 tests passed
```

<!-- hints -->
- `@Transactional` from `org.springframework.transaction.annotation` (not `jakarta.transaction`).
- By default Spring rolls back on `RuntimeException` and `Error` only — a **checked** exception still **commits** (an EJB-era convention). Use `@Transactional(rollbackFor = Exception.class)` or `rollbackFor = InvoiceException.class`.
- `@Transactional(readOnly = true)` lets JPA skip dirty checking and lets drivers route to replicas; it's passed to the transaction manager in the `TransactionDefinition`.
- `importAll()` runs on the real object behind the proxy, so its `this.placeOrder()` calls never reach the transaction interceptor — exactly what you saw with the auditing aspect on Day 19.

<!-- solution -->
```java
// src/main/java/com/example/practice/d22/rollback/OrderService.java
package com.example.practice.d22.rollback;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    @Transactional                                         // rolls back on RuntimeException / Error
    public void placeOrder(boolean fail) {
        if (fail) throw new IllegalStateException("payment declined");
    }

    @Transactional                                         // checked exception → COMMIT (surprise!)
    public void invoiceWithDefaultRules() throws InvoiceException {
        throw new InvoiceException("PDF service down");
    }

    @Transactional(rollbackFor = InvoiceException.class)   // now it rolls back
    public void invoiceWithRollbackFor() throws InvoiceException {
        throw new InvoiceException("PDF service down");
    }

    @Transactional(readOnly = true)
    public List<String> findOrders() { return List.of("o-1", "o-2"); }

    public void importAll() {                              // self-invocation → no proxy → no transaction
        placeOrder(false);
        placeOrder(false);
    }
}
```

**Interview checklist for "why didn't it roll back?"** Checked exception without `rollbackFor` · exception caught inside the method · self-invocation · method not `public` (pre-Spring 6) or `final` · class not a Spring bean (created with `new`) · wrong transaction manager · the work happened on another thread (`@Async`, `CompletableFuture`) — transactions are bound to the thread.

<!-- exercise: d22_e2 | Medium | Propagation: `REQUIRED`, `REQUIRES_NEW`, `MANDATORY` -->
**Concepts:** `REQUIRED` joins an existing transaction · `REQUIRES_NEW` suspends it and commits independently · `MANDATORY` fails without a transaction · `TransactionSynchronizationManager.isActualTransactionActive()` · propagation only applies across **beans**

**Task.** Three beans cooperate during checkout. Pick the right propagation for each method so the test passes:

- `CheckoutService.checkout(fail)` starts the main transaction.
- `AuditService.record(...)` must be saved **even if checkout rolls back** → its own transaction.
- `InventoryService.reserve(...)` must run inside the caller's transaction and **refuse** to run without one.

**Starter code**

```java
// src/main/java/com/example/practice/d22/propagation/AuditService.java
package com.example.practice.d22.propagation;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    private final List<String> entries = new CopyOnWriteArrayList<>();

    // TODO: always its own transaction
    public void record(String entry) { entries.add(entry); }

    public List<String> entries() { return List.copyOf(entries); }
    public void clear() { entries.clear(); }
}
```

```java
// src/main/java/com/example/practice/d22/propagation/InventoryService.java
package com.example.practice.d22.propagation;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class InventoryService {

    // TODO: must join an existing transaction, never start one
    public boolean reserve(String sku) {
        return TransactionSynchronizationManager.isActualTransactionActive();   // true when inside a transaction
    }
}
```

```java
// src/main/java/com/example/practice/d22/propagation/CheckoutService.java
package com.example.practice.d22.propagation;

import org.springframework.stereotype.Service;

@Service
public class CheckoutService {
    private final AuditService audit;
    private final InventoryService inventory;

    public CheckoutService(AuditService audit, InventoryService inventory) {
        this.audit = audit;
        this.inventory = inventory;
    }

    // TODO: the main transaction
    public boolean checkout(boolean fail) {
        audit.record("checkout attempted");
        boolean reservedInsideTx = inventory.reserve("SKU-1");
        if (fail) throw new IllegalStateException("card declined");
        return reservedInsideTx;
    }
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d22/propagation/PropagationTest.java
package com.example.practice.d22.propagation;

import com.example.practice.d22.RecordingTransactionManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringJUnitConfig(PropagationTest.Config.class)
class PropagationTest {

    @Configuration
    @EnableTransactionManagement
    @Import({AuditService.class, InventoryService.class, CheckoutService.class})
    static class Config {
        @Bean RecordingTransactionManager transactionManager() { return new RecordingTransactionManager(); }
    }

    @Autowired CheckoutService checkout;
    @Autowired InventoryService inventory;
    @Autowired AuditService audit;
    @Autowired RecordingTransactionManager tx;

    @BeforeEach
    void reset() { tx.reset(); audit.clear(); }

    @Test
    void successfulCheckoutUsesOneOuterAndOneAuditTransaction() {
        assertThat(checkout.checkout(false)).isTrue();                 // inventory joined the outer tx
        assertThat(tx.events()).containsExactly("BEGIN tx1", "BEGIN tx2", "COMMIT tx2", "COMMIT tx1");
    }

    @Test
    void auditSurvivesWhenCheckoutRollsBack() {
        assertThatThrownBy(() -> checkout.checkout(true)).isInstanceOf(IllegalStateException.class);
        assertThat(tx.events()).containsExactly("BEGIN tx1", "BEGIN tx2", "COMMIT tx2", "ROLLBACK tx1");
        assertThat(audit.entries()).containsExactly("checkout attempted");
    }

    @Test
    void mandatoryRefusesToRunWithoutATransaction() {
        assertThatThrownBy(() -> inventory.reserve("SKU-1")).isInstanceOf(IllegalTransactionStateException.class);
    }
}
```

**Expected result**

```text
PropagationTest: 3 tests passed
```

<!-- hints -->
- `@Transactional` alone means `propagation = Propagation.REQUIRED`: join if one exists, otherwise start one.
- `REQUIRES_NEW` suspends the caller's transaction (tx1), runs in tx2, commits tx2, then resumes tx1 — so the audit commit happens even if tx1 later rolls back.
- `MANDATORY` throws `IllegalTransactionStateException` when there's no transaction to join.
- `inventory.reserve` joins tx1, so it produces **no** BEGIN/COMMIT of its own — joined methods don't commit; only the outermost one does.
- Careful in real code: `REQUIRES_NEW` holds **two** database connections at once (the suspended one stays open), which can exhaust a small pool under load.

<!-- solution -->
```java
// src/main/java/com/example/practice/d22/propagation/AuditService.java
package com.example.practice.d22.propagation;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {
    private final List<String> entries = new CopyOnWriteArrayList<>();

    @Transactional(propagation = Propagation.REQUIRES_NEW)     // independent commit
    public void record(String entry) { entries.add(entry); }

    public List<String> entries() { return List.copyOf(entries); }
    public void clear() { entries.clear(); }
}
```

```java
// src/main/java/com/example/practice/d22/propagation/InventoryService.java
package com.example.practice.d22.propagation;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class InventoryService {

    @Transactional(propagation = Propagation.MANDATORY)        // join, or fail loudly
    public boolean reserve(String sku) {
        return TransactionSynchronizationManager.isActualTransactionActive();
    }
}
```

```java
// src/main/java/com/example/practice/d22/propagation/CheckoutService.java
package com.example.practice.d22.propagation;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CheckoutService {
    private final AuditService audit;
    private final InventoryService inventory;

    public CheckoutService(AuditService audit, InventoryService inventory) {
        this.audit = audit;
        this.inventory = inventory;
    }

    @Transactional                                             // REQUIRED: the outer transaction
    public boolean checkout(boolean fail) {
        audit.record("checkout attempted");                    // suspends tx1, runs in tx2
        boolean reservedInsideTx = inventory.reserve("SKU-1"); // joins tx1
        if (fail) throw new IllegalStateException("card declined");
        return reservedInsideTx;
    }
}
```

**All seven propagations in one table.** `REQUIRED` (default) join or create · `REQUIRES_NEW` always new, suspend the caller · `NESTED` savepoint inside the caller (JDBC only) · `SUPPORTS` join if present, else run without · `NOT_SUPPORTED` suspend and run without · `MANDATORY` must join · `NEVER` must not be in one.

<!-- exercise: d22_e3 | Medium | Optimistic locking with `@Version` -->
<!-- verify: compile -->
**Concepts:** `@Version` column · lost updates between two readers · `ObjectOptimisticLockingFailureException` · pessimistic `@Lock(PESSIMISTIC_WRITE)` → `SELECT … FOR UPDATE` · `TransactionTemplate` for programmatic transactions

**Task.** Two users load the same wallet and both deposit — without protection the second save silently overwrites the first.

1. Add a `@Version` field to `Wallet` so the stale second save is **rejected**.
2. Add `findForUpdate(id)` with a pessimistic write lock.

The test turns off the test-managed transaction so each repository call runs in its own transaction, like separate HTTP requests.

**Starter code**

```java
// src/main/java/com/example/practice/d22/locking/Wallet.java
package com.example.practice.d22.locking;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Wallet {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String owner;
    private long balance;
    // TODO: a version field managed by JPA

    protected Wallet() { }
    public Wallet(String owner, long balance) { this.owner = owner; this.balance = balance; }

    public void deposit(long amount) { balance += amount; }
    public Long getId() { return id; }
    public long getBalance() { return balance; }
    public long getVersion() { return 0; }   // TODO: return the version field
}
```

```java
// src/main/java/com/example/practice/d22/locking/WalletRepository.java
package com.example.practice.d22.locking;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findForUpdate(Long id);   // TODO: pessimistic write lock + @Query
}
```

**Given test** (don't change it)

```java
// src/test/java/com/example/practice/d22/locking/OptimisticLockTest.java
package com.example.practice.d22.locking;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@Transactional(propagation = Propagation.NOT_SUPPORTED)     // every repository call = its own transaction
class OptimisticLockTest {

    @Autowired WalletRepository wallets;
    @Autowired PlatformTransactionManager txManager;

    @AfterEach
    void clean() { wallets.deleteAll(); }

    @Test
    void versionIncrementsOnEveryUpdate() {
        Wallet w = wallets.save(new Wallet("asha", 100));
        assertThat(w.getVersion()).isZero();
        w.deposit(10);
        assertThat(wallets.save(w).getVersion()).isEqualTo(1);
    }

    @Test
    void staleUpdateIsRejectedInsteadOfLost() {
        Long id = wallets.save(new Wallet("asha", 100)).getId();
        Wallet first = wallets.findById(id).orElseThrow();
        Wallet second = wallets.findById(id).orElseThrow();   // both read version 0

        first.deposit(100);
        wallets.save(first);                                  // version 0 → 1

        second.deposit(50);
        assertThatThrownBy(() -> wallets.save(second))        // still says version 0
                .isInstanceOf(ObjectOptimisticLockingFailureException.class);
        assertThat(wallets.findById(id).orElseThrow().getBalance()).isEqualTo(200);
    }

    @Test
    void pessimisticLockReadsInsideATransaction() {
        Long id = wallets.save(new Wallet("ravi", 500)).getId();
        Long balance = new TransactionTemplate(txManager)
                .execute(status -> wallets.findForUpdate(id).orElseThrow().getBalance());   // SELECT ... FOR UPDATE
        assertThat(balance).isEqualTo(500);
    }
}
```

**Expected result**

```text
OptimisticLockTest: 3 tests passed
```

<!-- hints -->
- `@Version private long version;` (`jakarta.persistence.Version`). Hibernate adds `where id = ? and version = ?` to every UPDATE and increments the version; 0 rows updated means someone else changed it first.
- Spring translates Hibernate's `OptimisticLockException` / `StaleObjectStateException` into `ObjectOptimisticLockingFailureException`.
- `@Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select w from Wallet w where w.id = :id") Optional<Wallet> findForUpdate(@Param("id") Long id);`
- Pessimistic locks only work **inside** a transaction — that's why the test wraps the call in `TransactionTemplate`.
- In an API, map the optimistic-lock exception to **409 Conflict**, or retry the whole read-modify-write a few times.

<!-- solution -->
```java
// src/main/java/com/example/practice/d22/locking/Wallet.java
package com.example.practice.d22.locking;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Version;

@Entity
public class Wallet {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String owner;
    private long balance;

    @Version                                                   // checked and incremented on every UPDATE
    private long version;

    protected Wallet() { }
    public Wallet(String owner, long balance) { this.owner = owner; this.balance = balance; }

    public void deposit(long amount) { balance += amount; }
    public Long getId() { return id; }
    public long getBalance() { return balance; }
    public long getVersion() { return version; }
}
```

```java
// src/main/java/com/example/practice/d22/locking/WalletRepository.java
package com.example.practice.d22.locking;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WalletRepository extends JpaRepository<Wallet, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)                      // SELECT ... FOR UPDATE
    @Query("select w from Wallet w where w.id = :id")
    Optional<Wallet> findForUpdate(@Param("id") Long id);
}
```

**Optimistic or pessimistic?** Optimistic (`@Version`): no locks held, best when conflicts are rare (profile edits, most CRUD); the loser retries or gets a 409. Pessimistic (`FOR UPDATE`): blocks other writers, best for hot rows where conflicts are common (seat booking, inventory counters) — keep those transactions short and add a lock timeout.
