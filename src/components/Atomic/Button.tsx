import { Button } from "@/components/ui";
import { ButtonProps } from "@/components/ui/Button";

// Mantém compatibilidade com o componente anterior mas usa o novo sistema
const ButtonJeli = (props: ButtonProps) => {
  return (
    <Button 
      variant="contained" 
      size="small" 
      style={{ marginTop: 8, marginBottom: 8, marginRight: 8 }}
      {...props}
    >
      {props.children}
    </Button>
  );
};

export default ButtonJeli;
