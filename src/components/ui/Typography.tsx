import React from 'react';

/**
 * Typography System
 * 
 * Provides consistent text styling across the application.
 * Use these components instead of inline Tailwind typography classes.
 * 
 * @example
 * // Instead of:
 * <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal">Label</p>
 * 
 * // Use:
 * <Text.Mono>Label</Text.Mono>
 * <Text.Mono muted>Muted label</Text.Mono>
 */

type TextColor = 'default' | 'muted' | 'muted-light' | 'muted-medium' | 'accent' | 'success' | 'error';

interface BaseTextProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  color?: TextColor;
  muted?: boolean; // Shorthand for color="muted"
}

const colorClasses: Record<TextColor, string> = {
  default: 'text-charcoal',
  muted: 'text-charcoal/60',
  'muted-light': 'text-charcoal/40',
  'muted-medium': 'text-charcoal/70',
  accent: 'text-accent',
  success: 'text-green-600',
  error: 'text-red-600',
};

const getColorClass = (color?: TextColor, muted?: boolean): string => {
  if (muted) return colorClasses.muted;
  if (color) return colorClasses[color];
  return colorClasses.default;
};

/* ============================================
   MONO TEXT COMPONENTS
   ============================================ */

interface MonoProps extends BaseTextProps {
  size?: 'xs' | 'sm' | 'base' | 'md' | 'body' | 'body-caps' | 'header';
}

/**
 * Mono text - JetBrains Mono, uppercase
 * 
 * Sizes:
 * - xs: 8px (tiny labels)
 * - sm: 9px (buttons, dropdowns)
 * - base: 10px (default, most common)
 * - md: 12px (modal headings)
 * - body: responsive 10px → 12px → 14px
 * - body-caps: responsive with uppercase
 * - header: 10px with extra tracking (section headers)
 */
const Mono: React.FC<MonoProps> = ({
  children,
  className = '',
  as: Component = 'span',
  size = 'base',
  color,
  muted,
}) => {
  const sizeClasses: Record<string, string> = {
    xs: 'text-mono-xs',
    sm: 'text-mono-sm',
    base: 'text-mono-base',
    md: 'text-mono-md',
    body: 'text-mono-body',
    'body-caps': 'text-mono-body-caps',
    header: 'text-mono-header',
  };

  return (
    <Component className={`${sizeClasses[size]} ${getColorClass(color, muted)} ${className}`}>
      {children}
    </Component>
  );
};

/* ============================================
   SERIF TEXT COMPONENTS
   ============================================ */

interface SerifProps extends BaseTextProps {
  size?: 'base' | 'lg' | 'xl' | '2xl' | 'title';
  italic?: boolean;
}

/**
 * Serif text - PP Editorial Old
 * 
 * Sizes:
 * - base: 16px
 * - lg: 18px
 * - xl: 20px (modal headings)
 * - 2xl: 24px
 * - title: responsive 24px → 30px → 36px (page titles)
 */
const Serif: React.FC<SerifProps> = ({
  children,
  className = '',
  as: Component = 'span',
  size = 'base',
  color,
  muted,
  italic,
}) => {
  const sizeClasses: Record<string, string> = {
    base: 'text-serif-base',
    lg: 'text-serif-lg',
    xl: 'text-serif-xl',
    '2xl': 'text-serif-2xl',
    title: 'text-serif-title',
  };

  return (
    <Component className={`${sizeClasses[size]} ${getColorClass(color, muted)} ${italic ? 'italic' : ''} ${className}`}>
      {children}
    </Component>
  );
};

/* ============================================
   SPECIALIZED TEXT COMPONENTS
   ============================================ */

interface LabelProps extends Omit<MonoProps, 'size'> {
  htmlFor?: string;
}

/**
 * Form label - mono base with proper semantics
 */
const Label: React.FC<LabelProps> = ({
  children,
  className = '',
  htmlFor,
  color,
  muted,
}) => {
  return (
    <label 
      htmlFor={htmlFor}
      className={`text-mono-base ${getColorClass(color, muted)} ${className}`}
    >
      {children}
    </label>
  );
};

interface LinkProps extends Omit<BaseTextProps, 'as'> {
  href?: string;
  onClick?: () => void;
}

/**
 * Text link - mono with underline and hover effect
 */
const Link: React.FC<LinkProps> = ({
  children,
  className = '',
  href,
  onClick,
}) => {
  if (href) {
    return (
      <a href={href} className={`text-link ${className}`}>
        {children}
      </a>
    );
  }
  
  return (
    <button onClick={onClick} className={`text-link ${className}`}>
      {children}
    </button>
  );
};

interface HeadingProps extends Omit<SerifProps, 'as'> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Semantic heading with serif styling
 */
const Heading: React.FC<HeadingProps> = ({
  children,
  className = '',
  level = 2,
  size,
  color,
  muted,
  italic,
}) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  // Default sizes based on heading level
  const defaultSizes: Record<number, SerifProps['size']> = {
    1: 'title',
    2: 'xl',
    3: 'lg',
    4: 'base',
    5: 'base',
    6: 'base',
  };
  
  const finalSize = size || defaultSizes[level];
  
  const sizeClasses: Record<string, string> = {
    base: 'text-serif-base',
    lg: 'text-serif-lg',
    xl: 'text-serif-xl',
    '2xl': 'text-serif-2xl',
    title: 'text-serif-title',
  };

  return (
    <Component className={`${sizeClasses[finalSize!]} ${getColorClass(color, muted)} ${italic ? 'italic' : ''} ${className}`}>
      {children}
    </Component>
  );
};

interface SectionHeaderProps extends Omit<BaseTextProps, 'as'> {}

/**
 * Section header - mono with extra tracking
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  children,
  className = '',
  color,
  muted,
}) => {
  return (
    <div className={`text-mono-header ${getColorClass(color, muted)} ${className}`}>
      {children}
    </div>
  );
};

interface BodyProps extends Omit<MonoProps, 'size'> {
  responsive?: boolean;
  uppercase?: boolean;
}

/**
 * Body text - responsive mono text
 */
const Body: React.FC<BodyProps> = ({
  children,
  className = '',
  as: Component = 'p',
  color,
  muted,
  uppercase = false,
}) => {
  const textClass = uppercase ? 'text-mono-body-caps' : 'text-mono-body';
  
  return (
    <Component className={`${textClass} ${getColorClass(color, muted)} ${className}`}>
      {children}
    </Component>
  );
};

/* ============================================
   EXPORT
   ============================================ */

export const Text = {
  Mono,
  Serif,
  Label,
  Link,
  Heading,
  SectionHeader,
  Body,
};

// Also export individual components for convenience
export { Mono, Serif, Label, Link as TextLink, Heading, SectionHeader, Body };

export default Text;
