import React from 'react';
import {
  Button,
  Card as HeroCard,
  Input,
  Select,
  Tooltip
} from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal';
import { SelectItem } from '@heroui/select';
import { Info } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <HeroCard className={`border border-accents-2 transition-all hover:border-accents-3 ${className}`} shadow="none">
        <div className="p-6">
            {children}
        </div>
    </HeroCard>
);

export const ButtonComponent: React.FC<any> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) => {
    let heroVariant: "solid" | "bordered" | "light" | "flat" | "ghost" | "shadow" = "solid";
    let color: "default" | "primary" | "secondary" | "success" | "warning" | "danger" = "primary";

    if (variant === 'secondary') {
        heroVariant = "bordered";
        color = "default";
    } else if (variant === 'ghost') {
        heroVariant = "light";
        color = "default";
    } else if (variant === 'error') {
        color = "danger";
    }

    return (
        <Button
            variant={heroVariant}
            color={color}
            size={size === 'md' ? 'md' : size === 'sm' ? 'sm' : 'lg'}
            className={`rounded-md font-medium ${className}`}
            {...props}
        >
            {children}
        </Button>
    );
};

export { ButtonComponent as Button };

export const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; subtext?: string; colorClass?: string; tooltip?: string }> = ({ title, value, icon, subtext, colorClass = 'text-primary', tooltip }) => (
  <Card className="h-full flex flex-col justify-between min-h-[140px]">
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <h3 className="text-accents-5 text-xs font-medium uppercase tracking-widest truncate">{title}</h3>
            {tooltip && (
                <Tooltip content={tooltip}>
                    <Info size={14} className="text-accents-3 hover:text-foreground cursor-help transition-colors" />
                </Tooltip>
            )}
        </div>
        <div className={`p-2 ${colorClass}`}>
          {React.cloneElement(icon as any, { size: 18 })}
        </div>
      </div>
      <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
    </div>
    {subtext && <span className="text-accents-4 text-xs mt-2 block font-medium">{subtext}</span>}
  </Card>
);

export const InputComponent: React.FC<any> = ({ label, icon: Icon, type = "text", value, onChange, placeholder, required = false, className = '', ...props }) => (
    <Input
        label={label}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        startContent={Icon ? <Icon size={18} className="text-accents-4" /> : null}
        variant="bordered"
        radius="sm"
        labelPlacement="outside"
        classNames={{
            label: "text-xs font-medium text-accents-5 uppercase tracking-widest mb-1.5 ml-1",
            inputWrapper: "border-accents-2 hover:border-accents-3 focus-within:!border-foreground",
        }}
        className={`mb-4 ${className}`}
        {...props}
    />
);

export { InputComponent as Input };

export const SelectComponent: React.FC<any> = ({ label, icon: Icon, value, onChange, options, className = '' }) => {
    return (
        <Select
            label={label}
            selectedKeys={value ? [value] : []}
            onChange={onChange}
            startContent={Icon ? <Icon size={18} className="text-accents-4" /> : null}
            variant="bordered"
            radius="sm"
            labelPlacement="outside"
            classNames={{
                label: "text-xs font-medium text-accents-5 uppercase tracking-widest mb-1.5 ml-1",
                trigger: "border-accents-2 hover:border-accents-3 focus-within:!border-foreground",
            }}
            className={`mb-4 ${className}`}
        >
            {options.map((opt: any) => (
                <SelectItem key={opt.value}>
                    {opt.label}
                </SelectItem>
            ))}
        </Select>
    );
}

export { SelectComponent as Select };

export const ModalComponent: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="2xl" scrollBehavior="inside" backdrop="blur" classNames={{
        base: "bg-background border border-accents-2",
        header: "border-b border-accents-2 px-6 py-4",
        body: "p-6",
        closeButton: "hover:bg-accents-1 active:bg-accents-2 transition-colors",
    }}>
        <ModalContent>
            {(onClose) => (
                <>
                    <ModalHeader className="text-base font-semibold text-foreground tracking-tight">{title}</ModalHeader>
                    <ModalBody>
                        {children}
                    </ModalBody>
                </>
            )}
        </ModalContent>
    </Modal>
);

export { ModalComponent as Modal };
