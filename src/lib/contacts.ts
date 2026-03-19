import type { ContactIconKind } from "@/components/contact-icon"
import { getCraftCollectionItems } from "@/lib/craft"
import { siteAuthorUrl } from "@/lib/site"

export type ContactLink = {
  id: string
  title: string
  label: string
  icon: ContactIconKind
  url: string
  enabled: boolean
}

const allowedIcons: ContactIconKind[] = [
  "github",
  "instagram",
  "linkedin",
  "email",
  "link",
]

function ensureString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function ensureBoolean(value: unknown) {
  return value === true
}

function normalizeIcon(value: unknown): ContactIconKind {
  const raw = ensureString(value).toLowerCase() as ContactIconKind
  return allowedIcons.includes(raw) ? raw : "link"
}

function getDefaultContacts(): ContactLink[] {
  const defaults: ContactLink[] = [
    {
      id: "default-github",
      title: "GitHub",
      label: "github",
      icon: "github",
      url: "https://github.com/wilgon456",
      enabled: true,
    },
  ]

  if (siteAuthorUrl) {
    defaults.push({
      id: "default-instagram",
      title: "Instagram",
      label: "instagram",
      icon: "instagram",
      url: siteAuthorUrl,
      enabled: true,
    })
  }

  return defaults
}

function normalizeContact(
  item: Awaited<ReturnType<typeof getCraftCollectionItems>>[number],
): ContactLink {
  const properties = item.properties ?? {}
  const title = ensureString(item.title) || "Contact"
  const label = ensureString(properties.label) || title
  const url = ensureString(properties.url)

  return {
    id: item.id,
    title,
    label,
    icon: normalizeIcon(properties.icon),
    url,
    enabled: ensureBoolean(properties.enabled),
  }
}

export async function getContactLinks() {
  try {
    const items = await getCraftCollectionItems("Contacts")
    const normalized = items
      .map(normalizeContact)
      .filter((item) => item.enabled && item.url)

    return normalized.length ? normalized : getDefaultContacts()
  } catch {
    return getDefaultContacts()
  }
}
