import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NewJobcardStateService {
  state: any = null;

  saveState(state: any) {
    this.state = state;
  }

  getState() {
    return this.state;
  }

  clearState() {
    this.state = null;
  }
}
