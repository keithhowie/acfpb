import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']
})
export class PasswordResetComponent implements OnInit {

  done = false;
  loginFg = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  constructor(
    private afAuth: AngularFireAuth,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
  }

  async reset() {
    if (this.loginFg.valid) {
      this.snackBar.dismiss();
      try {
        await this.afAuth.auth.sendPasswordResetEmail(this.loginFg.controls.email.value);
        this.done = true;
      } catch (e) {
        console.error(e);
        this.snackBar.open('Failed to send email', 'OK');
      }
    }
  }

}
