"use client"

import * as React from "react"
import type { FieldValues, FieldPath, UseFormReturn, FieldError } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface FormContextValue {
  form: UseFormReturn<any> | null
}

const FormContext = React.createContext<FormContextValue>({
  form: null,
})

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  form: UseFormReturn<any>
}

function Form({ form, children, className, ...props }: FormProps) {
  return (
    <FormContext.Provider value={{ form }}>
      <form className={cn(className)} {...props}>
        {children}
      </form>
    </FormContext.Provider>
  )
}

interface FormFieldContextValue {
  name: string
}

const FormFieldContext = React.createContext<FormFieldContextValue>({
  name: "",
})

interface FormFieldProps<TFieldValues extends FieldValues = FieldValues> {
  name: FieldPath<TFieldValues>
  control?: any
  children: React.ReactNode
}

function FormField<TFieldValues extends FieldValues = FieldValues>({
  name,
  children,
}: FormFieldProps<TFieldValues>) {
  return (
    <FormFieldContext.Provider value={{ name }}>
      {children}
    </FormFieldContext.Provider>
  )
}

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  )
)
FormItem.displayName = "FormItem"

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, ...props }, ref) => {
    const { name } = React.useContext(FormFieldContext)
    const { form } = React.useContext(FormContext)
    const error = form?.formState.errors[name]

    return (
      <Label
        ref={ref}
        className={cn(error && "text-destructive", className)}
        {...props}
      />
    )
  }
)
FormLabel.displayName = "FormLabel"

interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ ...props }, ref) => (
    <div ref={ref} {...props} />
  )
)
FormControl.displayName = "FormControl"

interface FormDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  FormDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[0.8rem] text-muted-foreground", className)}
    {...props}
  />
))
FormDescription.displayName = "FormDescription"

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  name?: string
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, name: nameProp, ...props }, ref) => {
    const { name: fieldName } = React.useContext(FormFieldContext)
    const { form } = React.useContext(FormContext)
    const name = nameProp || fieldName
    const error = form?.formState.errors[name]

    if (!error) return null

    const message =
      typeof error.message === "string"
        ? error.message
        : "Invalid value"

    return (
      <p
        ref={ref}
        className={cn("text-[0.8rem] font-medium text-destructive", className)}
        {...props}
      >
        {message}
      </p>
    )
  }
)
FormMessage.displayName = "FormMessage"

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
}
