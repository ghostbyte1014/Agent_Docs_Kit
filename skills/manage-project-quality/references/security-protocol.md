# Security review protocol

## Purpose

Security assurance looks for exploitable weaknesses and missing controls that can affect confidentiality, integrity, availability, privacy, or release safety. Its output is evidence-based and can block release when a Critical or High control fails.

## Safety boundary

Repository inspection, dependency-manifest review, and static configuration review are passive. Dynamic scanning, fuzzing, credential use, exploit validation, cloud changes, load generation, and production access require explicit authorization for the named target. Stop when target ownership or permitted impact is unclear.

## Statuses

- `Pass`: sufficient evidence demonstrates the control.
- `Fail`: evidence demonstrates the control is absent, ineffective, or bypassable.
- `Unverified`: evidence is unavailable or cannot be safely collected.
- `N/A`: the control does not apply; record why.

Never infer `Pass` from absence of evidence. A tool reporting no finding is evidence only for the scope and limitations of that tool.

## Severity and release effect

Use Critical, High, Medium, Low, or Informational. Critical and High failures block release by default. An exception must name the risk owner, justification, compensating control, and expiry date.
