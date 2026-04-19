# Implement: Docs And Responsive Checks

Use `bundle-implementation` for diagnosis and `docs-and-cleanup` for documentation edits.

## Objective

Finish the Sankalpa tracking slice with durable documentation and responsive verification.

## Documentation

Update durable docs if behavior changed:

- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `docs/architecture.md` if model/API behavior changed in this group
- `requirements/decisions.md` for the long-lived presentation/model decision
- `requirements/session-handoff.md` for current state and remaining gaps

## Responsive Checks

Verify the Goals screen at phone and desktop widths. Confirm:

- text does not overlap controls
- long observance labels fit
- the tracking presentation remains calm at 28 days
- future dates are visibly locked without hiding them
- active sankalpa actions remain obvious
