import { Component } from '@angular/core';
import { FileDropzone } from '../../components/file-dropzone/file-dropzone';

@Component({
  selector: 'app-home',
  imports: [FileDropzone],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
