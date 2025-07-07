import { ActivityIndicator, Text, TouchableOpacity, StyleSheet } from "react-native";

const CustomButton = ({
  title,
  handlePress,
  containerStyles,
  textStyles,
  isLoading,
}) => {
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.button,
        isLoading && { opacity: 0.5 },
        containerStyles && containerStyles,
      ]}
      disabled={isLoading}
    >
      <Text style={[styles.text, textStyles && textStyles]}>
        {title}
      </Text>
      {isLoading && (
        <ActivityIndicator
          animating={isLoading}
          color="#fff"
          size="small"
          style={{ marginLeft: 8 }}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFA500',
    borderRadius: 16,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 48,
  },
  text: {
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
});

export default CustomButton;