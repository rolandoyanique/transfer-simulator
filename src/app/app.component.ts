import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './services/notification.service';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  title = 'transfer-simulator';
  currentLang = 'es';
  isDarkMode = false;
  isMobile = false;

  constructor(
    private translate: TranslateService,
    private notificationService: NotificationService
  ) {
    // Set default language
    this.translate.setDefaultLang('es');
    this.translate.use('es');
  }

  ngOnInit() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-mode');
    }

    // Check if mobile device
    this.checkIfMobile();
    window.addEventListener('resize', () => this.checkIfMobile());
  }

  checkIfMobile() {
    this.isMobile = window.innerWidth < 768;
    
    // Close sidenav when switching to desktop
    if (!this.isMobile && this.sidenav) {
      this.sidenav.close();
    }
  }

  switchLanguage(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);
    this.notificationService.showSuccess(`Idioma cambiado a ${lang === 'es' ? 'Español' : 'English'}`);
    
    // Close sidenav on language change if mobile
    if (this.isMobile) {
      this.sidenav.close();
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  // Navigation methods
  navigateTo(route: string) {
    // Close sidenav after navigation on mobile
    if (this.isMobile) {
      this.sidenav.close();
    }
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }
}