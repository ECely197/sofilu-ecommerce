import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appNumericFormat]',
  standalone: true,
})
export class NumericFormatDirective implements OnInit {
  constructor(
    private el: ElementRef<HTMLInputElement>,
    private ngControl: NgControl
  ) {}

  ngOnInit() {
    // Escuchamos los cambios de valor que vienen del FormControl (ej: patchValue)
    this.ngControl.control?.valueChanges.subscribe((value) => {
      // Solo formateamos si el campo no está activo para no interrumpir al usuario
      if (document.activeElement !== this.el.nativeElement) {
        this.formatAndSetValue(value);
      }
    });

    // Formateamos el valor inicial al cargar
    setTimeout(() => this.formatAndSetValue(this.ngControl.value), 0);
  }

  // Escuchamos cuando el usuario escribe en el input
  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.formatAndSetValue(inputElement.value, true);
  }

  // Escuchamos cuando el usuario sale del input
  @HostListener('blur')
  onBlur() {
    this.formatAndSetValue(this.el.nativeElement.value);
  }

  private formatAndSetValue(value: any, isUserInput = false) {
    // Limpiamos de cualquier cosa que no sea un dígito
    let numericString = String(value || '').replace(/[^0-9]/g, '');

    if (numericString === '') {
      this.el.nativeElement.value = '';
      if (this.ngControl.control && this.ngControl.control.value !== null) {
        this.ngControl.control.setValue(null, { emitEvent: false });
      }
      return;
    }

    const numericValue = Number(numericString);

    // Formateamos para la vista del usuario
    const formattedValue = new Intl.NumberFormat('es-CO').format(numericValue);
    this.el.nativeElement.value = formattedValue;

    // Actualizamos el FormControl con el valor numérico crudo
    if (
      this.ngControl.control &&
      this.ngControl.control.value !== numericValue
    ) {
      this.ngControl.control.setValue(numericValue, { emitEvent: false });
    }
  }
}
