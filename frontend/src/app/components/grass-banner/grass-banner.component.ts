import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grass-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grass-banner.component.html',
  styleUrls: ['./grass-banner.component.scss']
})
export class GrassBannerComponent {
  @Input() text: string = '';
}
