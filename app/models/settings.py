from typing import Optional
from pydantic import BaseModel, Field

class GlobalSettings(BaseModel):
  # 1. Business Branding & Information
  business_name: str = Field(
      "Healthy Home's Foods", description="Registered Business Name"
  )
  business_tagline: str = Field(
      "Authentic Home-Cooked Meal Subscriptions", description="Business Tagline"
  )
  business_phone: str = Field(
      "+91 98765 43210", description="Primary Customer Support Phone"
  )
  business_email: str = Field(
      "support@healthyhomefoods.com", description="Primary Support Email"
  )
  business_address: str = Field(
      "No. 45, Food Court Complex, Main Road, Chennai",
      description="Central Kitchen Address",
  )
  currency_symbol: str = Field("₹", description="Display Currency Symbol")
  gst_number: Optional[str] = Field(
      "33AAAAA0000A1Z5", description="GST Identification Number"
  )

  # 2. Meal Pricing & Discount Engine
  breakfast_price: float = Field(
      64.0, description="Default price per breakfast meal (₹)"
  )
  lunch_price: float = Field(
      100.0, description="Default price per lunch meal (₹)"
  )
  dinner_price: float = Field(
      64.0, description="Default price per dinner meal (₹)"
  )
  three_meal_lunch_discount_rate: float = Field(
      80.0, description="Discounted lunch rate if all 3 meals are selected"
  )
  veg_discount_percentage: float = Field(
      0.0, description="Percentage discount for 100% pure veg meal plans"
  )

  # 3. Delivery & Logistics
  delivery_charge_per_day: float = Field(
      0.0, description="Default daily delivery fee per customer"
  )
  free_delivery_distance_km: float = Field(
      5.0, description="Free delivery radius in KM"
  )
  extra_distance_charge_per_km: float = Field(
      10.0, description="Extra delivery charge per KM beyond free distance"
  )
  breakfast_delivery_time: str = Field(
      "07:30 AM", description="Target delivery time window for Breakfast"
  )
  lunch_delivery_time: str = Field(
      "12:30 PM", description="Target delivery time window for Lunch"
  )
  dinner_delivery_time: str = Field(
      "07:30 PM", description="Target delivery time window for Dinner"
  )

  # 4. Calendar & Working Days
  default_monthly_days: int = Field(
      26, description="Default active delivery days in a monthly plan"
  )
  default_weekly_days: int = Field(
      6, description="Default active delivery days in a weekly plan"
  )
  sunday_holiday_enabled: bool = Field(
      True, description="Automatically skip Sundays and extend subscription"
  )
  leave_cancellation_cutoff_hours: int = Field(
      2, description="Minimum notice cutoff hours before meal delivery"
  )

  # 5. Financial & Invoicing Controls
  invoice_prefix: str = Field("HHF-INV-", description="Invoice Number Prefix")
  invoice_footer_note: str = Field(
      "Thank you for subscribing to Healthy Home's Foods! Payment due within 5"
      " days.",
      description="Footer note printed on customer PDF invoices",
  )
  container_deposit_default: float = Field(
      500.0,
      description="Default refundable stainless steel container deposit",
  )
  upi_payment_id: str = Field(
      "healthyhomefoods@upi", description="Primary UPI Virtual Payment Address"
  )
  enable_whatsapp_reminders: bool = Field(
      True, description="Enable 1-click WhatsApp bill & delivery alerts"
  )


class GlobalSettingsUpdate(BaseModel):
  business_name: Optional[str] = None
  business_tagline: Optional[str] = None
  business_phone: Optional[str] = None
  business_email: Optional[str] = None
  business_address: Optional[str] = None
  currency_symbol: Optional[str] = None
  gst_number: Optional[str] = None

  breakfast_price: Optional[float] = None
  lunch_price: Optional[float] = None
  dinner_price: Optional[float] = None
  three_meal_lunch_discount_rate: Optional[float] = None
  veg_discount_percentage: Optional[float] = None

  delivery_charge_per_day: Optional[float] = None
  free_delivery_distance_km: Optional[float] = None
  extra_distance_charge_per_km: Optional[float] = None
  breakfast_delivery_time: Optional[str] = None
  lunch_delivery_time: Optional[str] = None
  dinner_delivery_time: Optional[str] = None

  default_monthly_days: Optional[int] = None
  default_weekly_days: Optional[int] = None
  sunday_holiday_enabled: Optional[bool] = None
  leave_cancellation_cutoff_hours: Optional[int] = None

  invoice_prefix: Optional[str] = None
  invoice_footer_note: Optional[str] = None
  container_deposit_default: Optional[float] = None
  upi_payment_id: Optional[str] = None
  enable_whatsapp_reminders: Optional[bool] = None
