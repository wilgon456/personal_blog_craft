/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next"
import Link from "next/link"
import { ContactIcon } from "@/components/contact-icon"
import { getContactLinks } from "@/lib/contacts"
import { getSiteProfile } from "@/lib/profile"
import { notFound } from "next/navigation"

const adminRouteEnabled = process.env.ENABLE_ADMIN_ROUTE === "true"

export function generateMetadata(): Metadata {
  if (!adminRouteEnabled) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    title: "Admin",
    description: "Profile admin guide for TUCHIZ-LOG",
    robots: {
      index: false,
      follow: false,
    },
  }
}

const profileFields = ["Display Name", "Role", "Bio", "Profile Image"]
const contactFields = ["Label", "Icon", "Url", "Enabled"]
const iconOptions = ["github", "instagram", "linkedin", "email", "link"]

export default async function AdminPage() {
  if (!adminRouteEnabled) {
    notFound()
  }

  const profile = await getSiteProfile()
  const contacts = await getContactLinks()

  return (
    <section className="about-page">
      <article className="article-shell admin-shell">
        <div className="about-shell__eyebrow">Admin</div>
        <div className="section-heading">
          <div>
            <h1>Site Admin</h1>
            <p>Manage the home profile and contact blocks from Craft.</p>
          </div>
        </div>

        <div className="admin-preview">
          <div className="home-avatar admin-preview__avatar">
            <img alt={profile.displayName} src={profile.profileImage} />
          </div>
          <div className="admin-preview__content">
            <h2>{profile.displayName}</h2>
            <p>{profile.role}</p>
            <p>{profile.bio}</p>
          </div>
        </div>

        <div className="admin-card-list">
          <section className="panel admin-card">
            <p className="home-panel-heading">Profile edit</p>
            <p>
              Edit the <strong>Profile</strong> collection item named{" "}
              <strong>Home Profile</strong>.
            </p>
            <div className="tag-row">
              {profileFields.map((field) => (
                <span className="tag-pill" key={field}>
                  {field}
                </span>
              ))}
            </div>
          </section>

          <section className="panel admin-card">
            <p className="home-panel-heading">Contact edit</p>
            <p>
              Add or edit rows in the <strong>Contacts</strong> collection. Each row
              becomes one contact item on the home page.
            </p>
            <div className="tag-row">
              {contactFields.map((field) => (
                <span className="tag-pill" key={field}>
                  {field}
                </span>
              ))}
            </div>
          </section>

          <section className="panel admin-card">
            <p className="home-panel-heading">Icon options</p>
            <div className="tag-row">
              {iconOptions.map((icon) => (
                <span className="tag-pill" key={icon}>
                  {icon}
                </span>
              ))}
            </div>
          </section>

          <section className="panel admin-card">
            <p className="home-panel-heading">Current contacts</p>
            <div className="home-contact-list">
              {contacts.map((contact) => (
                <div className="admin-contact-row" key={contact.id}>
                  <span className="home-contact-item">
                    <span className="home-contact-icon">
                      <ContactIcon kind={contact.icon} />
                    </span>
                    <span>{contact.label}</span>
                  </span>
                  <span className="home-contact-label">{contact.url}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel admin-card">
            <p className="home-panel-heading">Image rule</p>
            <p>
              Put a direct image URL in <strong>Profile Image</strong>. If left empty,
              the site falls back to the bundled profile image.
            </p>
          </section>
        </div>

        <div className="action-row">
          <Link className="button-secondary" href="/">
            Back home
          </Link>
          <Link className="button-secondary" href="/about">
            Open about
          </Link>
        </div>
      </article>
    </section>
  )
}
