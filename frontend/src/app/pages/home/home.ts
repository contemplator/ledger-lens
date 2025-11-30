import { Component, inject } from '@angular/core';
import { FileDropzone } from '../../components/file-dropzone/file-dropzone';
import { AppConfig } from '../../services/app-config';

@Component({
  selector: 'app-home',
  imports: [FileDropzone],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private configService = inject(AppConfig);
  appName = this.configService.appName;
}
