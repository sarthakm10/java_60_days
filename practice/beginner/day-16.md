Inheritance. Keep fields `private` in every class and let each constructor set up its own fields: the child's constructor hands the parent's part to `super(...)`.

<!-- exercise: b16_e1 | Easy | Employees and managers -->
**Concepts:** `extends` · `super(...)` in a constructor · `super.method()` · private fields with getters

**Task.** `Employee` has a name and a monthly salary. `Manager` extends it with a team size and a bonus of 5,000 per team member. Complete the constructors (the manager's must call `super`), `yearlyPay()` (12 × salary, plus the bonus for managers) and `describe()`. The manager's `describe()` must **reuse** the employee's text with `super.describe()`.

**Starter code** · `Company.java`

```java
class Employee {
    private final String name;
    private final int monthlySalary;

    Employee(String name, int monthlySalary) {
        // TODO
        this.name = null;
        this.monthlySalary = 0;
    }

    int getMonthlySalary() { return monthlySalary; }

    int yearlyPay() {
        return 0; // TODO
    }

    String describe() {
        return ""; // TODO: "Asha earns 600000 a year"
    }
}

class Manager extends Employee {
    private final int teamSize;

    Manager(String name, int monthlySalary, int teamSize) {
        super(name, monthlySalary);   // keep this as the first line
        this.teamSize = 0;            // TODO
    }

    @Override
    int yearlyPay() {
        return 0; // TODO: the employee's yearly pay + 5000 per team member
    }

    @Override
    String describe() {
        return ""; // TODO: super.describe() + " and manages 4 people"
    }
}

public class Company {
    public static void main(String[] args) {
        Employee asha = new Employee("Asha", 50000);
        Manager ravi = new Manager("Ravi", 80000, 4);
        System.out.println(asha.describe());
        System.out.println(ravi.describe());
    }
}
```

**Expected output**

```text
Asha earns 600000 a year
Ravi earns 980000 a year and manages 4 people
```

<!-- hints -->
- Employee constructor: `this.name = name; this.monthlySalary = monthlySalary;` (replace the placeholder lines).
- `Manager.yearlyPay()`: `super.yearlyPay() + teamSize * 5000`. `Manager` can't read `monthlySalary` directly (it's private), but it doesn't need to.
- `Employee.describe()` calls `yearlyPay()`. For a manager object, that call runs the **manager's** version, so the bonus appears in the text automatically (that's Day 17's polymorphism, already at work).
- Employee's `describe()` needs the name. You can return `name + " earns " + yearlyPay() + " a year"` from inside `Employee`.

<!-- solution -->
```java
class Employee {
    private final String name;
    private final int monthlySalary;

    Employee(String name, int monthlySalary) {
        this.name = name;
        this.monthlySalary = monthlySalary;
    }

    int getMonthlySalary() { return monthlySalary; }

    int yearlyPay() {
        return monthlySalary * 12;
    }

    String describe() {
        return name + " earns " + yearlyPay() + " a year";
    }
}

class Manager extends Employee {
    private final int teamSize;

    Manager(String name, int monthlySalary, int teamSize) {
        super(name, monthlySalary);
        this.teamSize = teamSize;
    }

    @Override
    int yearlyPay() {
        return super.yearlyPay() + teamSize * 5000;
    }

    @Override
    String describe() {
        return super.describe() + " and manages " + teamSize + " people";
    }
}

public class Company {
    public static void main(String[] args) {
        Employee asha = new Employee("Asha", 50000);
        Manager ravi = new Manager("Ravi", 80000, 4);
        System.out.println(asha.describe());
        System.out.println(ravi.describe());
    }
}
```

Ravi: 80,000 × 12 = 960,000, plus 4 × 5,000 = 980,000. Each class looks after its own fields, and `super.` reuses the parent's logic instead of copying it.

<!-- exercise: b16_e2 | Medium | Predict the output: constructor order -->
**Concepts:** parents are built first · the hidden `super()` · `this(...)` chaining

**Task.** Predict exactly what this prints, line by line, **before** running it. Then run it and explain each line.

**Starter code** · `ConstructorOrder.java`

```java
class Vehicle {
    Vehicle() {
        System.out.println("Vehicle()");
    }
}

class Car extends Vehicle {
    Car() {
        this("petrol");
        System.out.println("Car()");
    }

    Car(String fuel) {
        System.out.println("Car(" + fuel + ")");
    }
}

class SportsCar extends Car {
    SportsCar() {
        super();
        System.out.println("SportsCar()");
    }
}

public class ConstructorOrder {
    public static void main(String[] args) {
        new SportsCar();
        System.out.println("---");
        new Car("electric");
    }
}
```

<!-- hints -->
- Every constructor starts with `this(...)` or `super(...)`. If neither is written, Java inserts `super()`.
- `Car()` starts with `this("petrol")`, so it first runs `Car(String)`, which (having no `this`/`super` line) starts with an invisible `super()`.
- Nothing prints until the call chain reaches the top (`Vehicle`); then the prints happen on the way back down.

<!-- solution -->
```java
class Vehicle {
    Vehicle() {
        System.out.println("Vehicle()");
    }
}

class Car extends Vehicle {
    Car() {
        this("petrol");
        System.out.println("Car()");
    }

    Car(String fuel) {
        System.out.println("Car(" + fuel + ")");
    }
}

class SportsCar extends Car {
    SportsCar() {
        super();
        System.out.println("SportsCar()");
    }
}

public class ConstructorOrder {
    public static void main(String[] args) {
        new SportsCar();
        System.out.println("---");
        new Car("electric");
    }
}
```

**Expected output**

```text
Vehicle()
Car(petrol)
Car()
SportsCar()
---
Vehicle()
Car(electric)
```

`SportsCar()` → `Car()` → `Car("petrol")` → (hidden) `Vehicle()`. `Vehicle()` prints first, then each constructor finishes in reverse order. The object is always built from the top of the family down.
