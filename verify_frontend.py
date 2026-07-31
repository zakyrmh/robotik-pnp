from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000/login")
    page.wait_for_timeout(3000)

    # Login as admin
    page.fill('input[name="email"]', 'superadmin@robotikpnp.com') # dummy auth
    page.fill('input[name="password"]', 'admin123')
    page.get_by_role("button", name="Masuk").click()
    page.wait_for_timeout(3000)

    page.goto("http://localhost:3000/kegiatan-absensi-caang")
    page.wait_for_timeout(3000)

    # Click tab absensi
    page.get_by_role("tab", name="Rekap Absensi").click()
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path="/home/jules/verification/screenshots/verification2.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
