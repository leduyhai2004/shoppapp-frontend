import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';  
import { LOCALE_ID } from '@angular/core';
import localeVi from '@angular/common/locales/vi';
import { registerLocaleData } from '@angular/common';
import { ChatboxComponent } from '../components/chatbox/chatbox.component';
// Đăng ký locale tiếng Việt
registerLocaleData(localeVi, 'vi');

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [
        RouterModule,
        ChatboxComponent,
    ],
    providers: [
        { provide: LOCALE_ID, useValue: 'vi' }, // Đặt locale mặc định là 'vi'
    ],
})
export class AppComponent {

}
