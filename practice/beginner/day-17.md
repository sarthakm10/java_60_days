Polymorphism. The goal is code that works with the **parent type** and lets each object decide what to do, with as few `instanceof` checks as possible.

<!-- exercise: b17_e1 | Easy | Notifications through one parent type -->
**Concepts:** overriding with `@Override` · a parent-type array · one loop for every subclass

**Task.** `Notification` has a recipient and a `send(String message)` method returning the text that would be sent. Make `EmailNotification`, `SmsNotification` and `PushNotification` override `send` with the formats below. SMS messages longer than 20 characters are cut to 20 and end with `...`. Then send one message to everyone in a single loop.

**Starter code** · `Notifier.java`

```java
class Notification {
    protected final String recipient;

    Notification(String recipient) {
        this.recipient = recipient;
    }

    String send(String message) {
        return "To " + recipient + ": " + message;
    }
}

// TODO: class EmailNotification extends Notification   → "EMAIL to <recipient>: <message>"
// TODO: class SmsNotification extends Notification     → "SMS to <recipient>: <first 20 chars>..."
// TODO: class PushNotification extends Notification    → "PUSH [<recipient>] <message>"

public class Notifier {
    public static void main(String[] args) {
        Notification[] all = {
            new Notification("ops-team")
            // TODO: add new EmailNotification("asha@example.com"), new SmsNotification("+91 98765 43210"), new PushNotification("ravi")
        };
        for (Notification n : all) {
            System.out.println(n.send("Your order #4512 has shipped"));
        }
    }
}
```

**Expected output**

```text
To ops-team: Your order #4512 has shipped
EMAIL to asha@example.com: Your order #4512 has shipped
SMS to +91 98765 43210: Your order #4512 has...
PUSH [ravi] Your order #4512 has shipped
```

<!-- hints -->
- Each subclass needs a constructor that passes the recipient up: `EmailNotification(String recipient) { super(recipient); }`
- `recipient` is `protected` in the parent, so subclasses can use it directly in their messages.
- SMS: `message.length() > 20 ? message.substring(0, 20) + "..." : message`.
- The loop doesn't change at all: the array's type is `Notification`, and each object runs its own `send`.

<!-- solution -->
```java
class Notification {
    protected final String recipient;

    Notification(String recipient) {
        this.recipient = recipient;
    }

    String send(String message) {
        return "To " + recipient + ": " + message;
    }
}

class EmailNotification extends Notification {
    EmailNotification(String recipient) {
        super(recipient);
    }

    @Override
    String send(String message) {
        return "EMAIL to " + recipient + ": " + message;
    }
}

class SmsNotification extends Notification {
    SmsNotification(String recipient) {
        super(recipient);
    }

    @Override
    String send(String message) {
        String text = message.length() > 20 ? message.substring(0, 20) + "..." : message;
        return "SMS to " + recipient + ": " + text;
    }
}

class PushNotification extends Notification {
    PushNotification(String recipient) {
        super(recipient);
    }

    @Override
    String send(String message) {
        return "PUSH [" + recipient + "] " + message;
    }
}

public class Notifier {
    public static void main(String[] args) {
        Notification[] all = {
            new Notification("ops-team"),
            new EmailNotification("asha@example.com"),
            new SmsNotification("+91 98765 43210"),
            new PushNotification("ravi")
        };
        for (Notification n : all) {
            System.out.println(n.send("Your order #4512 has shipped"));
        }
    }
}
```

Adding a WhatsApp notification tomorrow means writing one new class; the sending loop never changes. That "add new types without touching existing code" property is what polymorphism buys you (and what Day 68's Open/Closed principle is about).

<!-- exercise: b17_e2 | Medium | Predict the output: overloading, overriding and instanceof -->
**Concepts:** compile-time overload choice · run-time override choice · static hiding · pattern matching

**Task.** Predict every line **before** running. This one has traps: think about the **variable's** type versus the **object's** type for each call.

**Starter code** · `WhichMethod.java`

```java
class Animal {
    String sound() { return "..."; }
    static String kind() { return "animal"; }
}

class Dog extends Animal {
    @Override
    String sound() { return "Woof"; }
    static String kind() { return "dog"; }
    String fetch() { return "fetching!"; }
}

public class WhichMethod {
    static String describe(Animal a) { return "an Animal saying " + a.sound(); }
    static String describe(Dog d) { return "a Dog saying " + d.sound(); }

    public static void main(String[] args) {
        Animal a = new Dog();
        Dog d = new Dog();
        Animal plain = new Animal();

        System.out.println(a.sound());
        System.out.println(plain.sound());
        System.out.println(describe(a));
        System.out.println(describe(d));
        System.out.println(Animal.kind() + " " + Dog.kind());

        Animal[] pets = { plain, a };
        for (Animal p : pets) {
            if (p instanceof Dog dog) {
                System.out.println(dog.fetch());
            } else {
                System.out.println("not a dog");
            }
        }
    }
}
```

<!-- hints -->
- `sound()` is overridden, so the **object** decides: `a` holds a Dog.
- `describe` is **overloaded**. The compiler picks the version from the **variable's declared type**, before the program runs. What is `a` declared as?
- Static methods aren't overridden; `Dog.kind()` hides `Animal.kind()`, and you call each through its class name.
- `instanceof Dog dog` checks the real object and gives you a `Dog` variable when it matches.

<!-- solution -->
```java
class Animal {
    String sound() { return "..."; }
    static String kind() { return "animal"; }
}

class Dog extends Animal {
    @Override
    String sound() { return "Woof"; }
    static String kind() { return "dog"; }
    String fetch() { return "fetching!"; }
}

public class WhichMethod {
    static String describe(Animal a) { return "an Animal saying " + a.sound(); }
    static String describe(Dog d) { return "a Dog saying " + d.sound(); }

    public static void main(String[] args) {
        Animal a = new Dog();
        Dog d = new Dog();
        Animal plain = new Animal();

        System.out.println(a.sound());
        System.out.println(plain.sound());
        System.out.println(describe(a));
        System.out.println(describe(d));
        System.out.println(Animal.kind() + " " + Dog.kind());

        Animal[] pets = { plain, a };
        for (Animal p : pets) {
            if (p instanceof Dog dog) {
                System.out.println(dog.fetch());
            } else {
                System.out.println("not a dog");
            }
        }
    }
}
```

**Expected output**

```text
Woof
...
an Animal saying Woof
a Dog saying Woof
animal dog
not a dog
fetching!
```

The third line is the big trap. **Which `describe`** is chosen at compile time from `a`'s declared type (`Animal`), but **which `sound`** runs inside it is chosen at run time from the object (a Dog). Overloading looks at variables; overriding looks at objects.
