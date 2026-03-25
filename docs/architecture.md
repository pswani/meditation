# Architecture

## Front-end architecture
Single-page React application with route-based screens and feature-oriented modules.

## Principles
- mobile-first
- responsive across device classes
- simple local-first architecture
- minimal dependencies
- predictable state
- domain-first naming

## Suggested module layout
- pages
- components
- features
- types
- utils

## Routing
Current primary routes:
- /
- /practice
- /practice/active
- /practice/playlists
- /practice/playlists/active
- /history
- /goals
- /sankalpa (redirects to `/goals` for compatibility)
- /settings

## Responsive shell guidance
- mobile: bottom navigation
- tablet and desktop: top or side navigation may be appropriate
- shared route structure should remain consistent across devices
