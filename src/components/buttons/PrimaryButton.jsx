import { Button } from "antd";

const PrimaryButton = ({
    children,
    ...props
}) => {
    return (
        <Button
            block
            size="large"
            type="primary"
            {...props}
        >
            {children}
        </Button>
    );
};

export default PrimaryButton;