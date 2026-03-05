import type { Config } from "@puckeditor/core";
import { HeadlineBlock, type HeadlineBlockProps } from "./blocks/HeadlineBlock";
import { TextBlock, type TextBlockProps } from "./blocks/TextBlock";
import { ImageBlock, type ImageBlockProps } from "./blocks/ImageBlock";
import { VideoBlock, type VideoBlockProps } from "./blocks/VideoBlock";
import { ButtonBlock, type ButtonBlockProps } from "./blocks/ButtonBlock";
import { SpacerBlock, type SpacerBlockProps } from "./blocks/SpacerBlock";
import { DividerBlock, type DividerBlockProps } from "./blocks/DividerBlock";
import { FormFieldBlock, type FormFieldBlockProps } from "./blocks/FormFieldBlock";
import { SelectBlock, type SelectBlockProps } from "./blocks/SelectBlock";
import { QuizBlock, type QuizBlockProps } from "./blocks/QuizBlock";
import { ProgressBarBlock, type ProgressBarBlockProps } from "./blocks/ProgressBarBlock";
import { CheckoutBlock, type CheckoutBlockProps } from "./blocks/CheckoutBlock";
import { CalendarBlock, type CalendarBlockProps } from "./blocks/CalendarBlock";
import { TestimonialBlock, type TestimonialBlockProps } from "./blocks/TestimonialBlock";
import { PricingTableBlock, type PricingTableBlockProps } from "./blocks/PricingTableBlock";
import { ValueStackBlock, type ValueStackBlockProps } from "./blocks/ValueStackBlock";
import { FaqBlock, type FaqBlockProps } from "./blocks/FaqBlock";
import { CountdownBlock, type CountdownBlockProps } from "./blocks/CountdownBlock";
import { CustomCodeBlock, type CustomCodeBlockProps } from "./blocks/CustomCodeBlock";
import { ExitIntentBlock, type ExitIntentBlockProps } from "./blocks/ExitIntentBlock";

type BlockProps = {
  Headline: HeadlineBlockProps;
  Text: TextBlockProps;
  Image: ImageBlockProps;
  Video: VideoBlockProps;
  Button: ButtonBlockProps;
  Spacer: SpacerBlockProps;
  Divider: DividerBlockProps;
  FormField: FormFieldBlockProps;
  Select: SelectBlockProps;
  Quiz: QuizBlockProps;
  ProgressBar: ProgressBarBlockProps;
  Checkout: CheckoutBlockProps;
  Calendar: CalendarBlockProps;
  Testimonial: TestimonialBlockProps;
  PricingTable: PricingTableBlockProps;
  ValueStack: ValueStackBlockProps;
  Faq: FaqBlockProps;
  Countdown: CountdownBlockProps;
  CustomCode: CustomCodeBlockProps;
  ExitIntent: ExitIntentBlockProps;
};

export const puckConfig: Config<BlockProps> = {
  components: {
    Headline: HeadlineBlock,
    Text: TextBlock,
    Image: ImageBlock,
    Video: VideoBlock,
    Button: ButtonBlock,
    Spacer: SpacerBlock,
    Divider: DividerBlock,
    FormField: FormFieldBlock,
    Select: SelectBlock,
    Quiz: QuizBlock,
    ProgressBar: ProgressBarBlock,
    Checkout: CheckoutBlock,
    Calendar: CalendarBlock,
    Testimonial: TestimonialBlock,
    PricingTable: PricingTableBlock,
    ValueStack: ValueStackBlock,
    Faq: FaqBlock,
    Countdown: CountdownBlock,
    CustomCode: CustomCodeBlock,
    ExitIntent: ExitIntentBlock,
  },
};
