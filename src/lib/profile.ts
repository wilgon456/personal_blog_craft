import { getCraftCollectionItems } from "@/lib/craft"
import { siteAuthorName, siteDescription, siteProfileImage } from "@/lib/site"

export type SiteProfile = {
  id: string
  title: string
  displayName: string
  role: string
  bio: string
  profileImage: string
}

function ensureString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function getDefaultProfile(): SiteProfile {
  return {
    id: "default-profile",
    title: "Home Profile",
    displayName: siteAuthorName,
    role: "frontend developer",
    bio: siteDescription,
    profileImage: siteProfileImage,
  }
}

function normalizeProfile(
  item: Awaited<ReturnType<typeof getCraftCollectionItems>>[number],
): SiteProfile {
  const fallback = getDefaultProfile()
  const properties = item.properties ?? {}

  return {
    id: item.id,
    title: ensureString(item.title) || fallback.title,
    displayName: ensureString(properties.display_name) || fallback.displayName,
    role: ensureString(properties.role) || fallback.role,
    bio: ensureString(properties.bio) || fallback.bio,
    profileImage: ensureString(properties.profile_image) || fallback.profileImage,
  }
}

export async function getSiteProfile() {
  try {
    const items = await getCraftCollectionItems("Profile")
    const item = items[0]

    if (!item) {
      return getDefaultProfile()
    }

    return normalizeProfile(item)
  } catch {
    return getDefaultProfile()
  }
}
