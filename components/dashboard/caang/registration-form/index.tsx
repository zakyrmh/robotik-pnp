"use client";

import { Loader2 } from "lucide-react";
import {
  RegistrationFormProvider,
  useRegistrationForm,
} from "./registration-form-context";
import { RegistrationStepper } from "./registration-stepper";
import { StepPersonalData } from "./step-personal-data";
import { StepDocuments } from "./step-documents";
import { StepPayment } from "./step-payment";
import { StepVerification } from "./step-verification";
import { Card, CardContent } from "@/components/ui/card";

// =========================================================
// INNER COMPONENT (Uses Context)
// =========================================================

function RegistrationFormContent() {
  const { currentStep, isLoading } = useRegistrationForm();

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat data pendaftaran...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <RegistrationStepper />

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && <StepPersonalData />}
        {currentStep === 2 && <StepDocuments />}
        {currentStep === 3 && <StepPayment />}
        {currentStep === 4 && <StepVerification />}
      </div>
    </div>
  );
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export function RegistrationForm() {
  return (
    <RegistrationFormProvider>
      <RegistrationFormContent />
    </RegistrationFormProvider>
  );
}
