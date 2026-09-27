import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
@Component({ selector: 'note-view', template: '<div [innerHTML]="html"></div>' })
export class NoteViewComponent {
  html: SafeHtml = '';
  constructor(private sanitizer: DomSanitizer) {}
  @Input() set note(userText: string) {
    this.html = this.sanitizer.bypassSecurityTrustHtml(userText);
  }
}
