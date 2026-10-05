# StyleAI

The styling studio: a person finishes a Session or a standalone quiz, pays an Invoice, and receives a report.

## Language

**Order**:
A purchase of one product for a completed Session.
_Avoid_: Purchase, transaction

**Style quiz**:
A standalone paid styling questionnaire, separate from a Session.
_Avoid_: Style session, style test

**AI quiz**:
A standalone paid questionnaire for face, body, or archetype, separate from a Session.
_Avoid_: AI session, AI test

**Invoice**:
The payment request attached to an Order, a Style quiz, or an AI quiz.
_Avoid_: Bill, charge

**Payment observation**:
The recorded claim that an Invoice was paid: amount, currency, payment id, and channel.
_Avoid_: Webhook, callback payload

**Settlement**:
The moment a Payment observation is accepted against an Invoice, so the Order, Style quiz, or AI quiz counts as paid.
_Avoid_: Confirmation, callback
