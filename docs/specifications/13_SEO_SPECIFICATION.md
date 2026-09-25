# AIML Club OCT — Connect
## SEO Specification

Version: 1.0

## 1. SEO Objective

Make the public AIML Club OCT ecosystem discoverable for:

- club events
- workshops
- competitions
- projects
- research
- learning resources
- Chronicle
- club history
- certificate verification

Private application data must never become indexed.

## 2. SEO Ownership

The existing public domain remains:

`https://aimlcluboct.in`

Connect may provide public data to the main website or its approved public surfaces.

The app domain:

`app.aimlcluboct.in`

is primarily authenticated.

## 3. Public Routes

Recommended:

```text
/events
/events/[slug]
/journey
/chronicle
/chronicle/[slug]
/projects
/projects/[slug]
/research
/research/[slug]
/learning
/learning/[slug]
/team
/about
/verify/[certificate-id]
```

## 4. Do Not Index

```text
/admin
/dashboard
/api
/account
/settings
/attendance
/private
/internal
```

Also prevent indexing of private participant/media routes.

## 5. Metadata

Every public page should have:

- unique title
- meta description
- canonical URL
- Open Graph metadata
- appropriate social preview image

Avoid duplicate metadata.

## 6. Structured Data

Use appropriate Schema.org types.

Possible:

- Organization
- EducationalOrganization
- Event
- Article
- Person
- BreadcrumbList
- ImageObject

Only publish structured data supported by visible page content.

## 7. Event SEO

Event pages may contain:

- event name
- date
- location
- organizer
- description
- registration state
- image
- related resources

Do not create event structured data for private/draft events.

## 8. Certificate Verification SEO

Verification pages can be public but should expose minimal information.

Consider appropriate indexing policy depending on privacy requirements.

Do not create an indexable page for every private student record.

## 9. Sitemap

Generate sitemap for approved public content.

Include:

- public events
- public Chronicle
- public Journey
- public projects
- public research
- public learning
- approved verification pages if policy permits

Exclude private URLs.

## 10. Robots

Robots policy must reinforce application authorization, not replace it.

A disallowed route is still required to be securely protected.

## 11. Internal Linking

Public pages should link naturally:

```text
Event
 ↓
Photos
 ↓
Project
 ↓
Chronicle
 ↓
Journey
```

Use meaningful anchor text.

## 12. Image SEO

Use:

- descriptive filenames
- meaningful alt text
- captions where useful
- responsive image sizes
- modern image formats where supported

Do not keyword-stuff alt text.

## 13. Performance

SEO implementation must prioritize:

- Core Web Vitals
- server rendering
- optimized images
- caching
- minimal client JavaScript
- stable layout

## 14. Search Engine Tools

Production setup should include:

- Google Search Console
- Bing Webmaster Tools

Verify the correct domain/property.

## 15. Canonicalization

Avoid duplicate pages caused by:

- query parameters
- alternate URLs
- trailing slash variants
- duplicate content

## 16. 404 and Redirects

Implement:

- useful 404
- permanent redirects for changed public slugs
- redirect mapping for legacy URLs where appropriate

## 17. SEO Content Quality

Do not generate hundreds of thin pages simply to increase page count.

Prefer fewer, useful pages with real:

- event information
- photographs
- outcomes
- resources
- project details
- historical context

## 18. SEO Rule

Public SEO is a content-quality and performance system, not a keyword-generation system.
