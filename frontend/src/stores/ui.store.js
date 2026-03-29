import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
const SIDEBAR_COLLAPSED_KEY = 'tm-ui-sidebar-collapsed';
const THEME_KEY = 'tm-ui-theme';
function readSidebarCollapsed() {
    try {
        return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    }
    catch {
        return false;
    }
}
function writeSidebarCollapsed(collapsed) {
    try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    }
    catch {
        /* ignore */
    }
}
function readTheme() {
    try {
        const v = localStorage.getItem(THEME_KEY);
        if (v === 'light' || v === 'dark' || v === 'system')
            return v;
    }
    catch {
        /* ignore */
    }
    return 'system';
}
function writeTheme(mode) {
    try {
        localStorage.setItem(THEME_KEY, mode);
    }
    catch {
        /* ignore */
    }
}
function applyThemeClass(mode) {
    if (typeof document === 'undefined')
        return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (mode === 'light') {
        root.classList.add('light');
        return;
    }
    if (mode === 'dark') {
        root.classList.add('dark');
        return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark)
        root.classList.add('dark');
}
export const useUiStore = defineStore('ui', () => {
    /** Desktop: true = narrow icon-only rail */
    const sidebarCollapsed = ref(readSidebarCollapsed());
    /** Mobile: overlay drawer open (< md breakpoint) */
    const mobileMenuOpen = ref(false);
    const theme = ref(readTheme());
    watch(sidebarCollapsed, (v) => writeSidebarCollapsed(v));
    watch(theme, (v) => {
        writeTheme(v);
        applyThemeClass(v);
    });
    if (typeof window !== 'undefined') {
        applyThemeClass(theme.value);
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', () => {
            if (theme.value === 'system')
                applyThemeClass('system');
        });
    }
    function toggleSidebarCollapsed() {
        sidebarCollapsed.value = !sidebarCollapsed.value;
    }
    function toggleMobileMenu() {
        mobileMenuOpen.value = !mobileMenuOpen.value;
    }
    function closeMobileMenu() {
        mobileMenuOpen.value = false;
    }
    /** Cycle light → dark → system */
    function cycleTheme() {
        const order = ['light', 'dark', 'system'];
        const i = order.indexOf(theme.value);
        theme.value = order[(i + 1) % order.length];
    }
    function setTheme(mode) {
        theme.value = mode;
    }
    const commandPaletteOpen = ref(false);
    function openCommandPalette() {
        commandPaletteOpen.value = true;
    }
    function closeCommandPalette() {
        commandPaletteOpen.value = false;
    }
    function toggleCommandPalette() {
        commandPaletteOpen.value = !commandPaletteOpen.value;
    }
    return {
        sidebarCollapsed,
        mobileMenuOpen,
        theme,
        commandPaletteOpen,
        toggleSidebarCollapsed,
        toggleMobileMenu,
        closeMobileMenu,
        cycleTheme,
        setTheme,
        openCommandPalette,
        closeCommandPalette,
        toggleCommandPalette,
    };
});
