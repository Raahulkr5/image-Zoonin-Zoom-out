import React, { useRef, useState } from 'react';
import {
    View,
    Image,
    StyleSheet,
    Animated,
    PanResponder,
    ActivityIndicator,
    Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export const LoadImageView = ({ URI, style, ImageResize }) => {
    const [loading, setLoading] = useState(true);
    const baseScale = useRef(new Animated.Value(1)).current;
    const pinchScale = useRef(new Animated.Value(1)).current;
    const scale = Animated.multiply(baseScale, pinchScale);

    const lastScale = useRef(1);

    const pan = useRef(new Animated.ValueXY()).current;
    const lastPan = useRef({ x: 0, y: 0 });

    const distanceRef = useRef(null);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: (evt, gestureState) => {
            },
            onPanResponderMove: (evt, gestureState) => {
                const touches = evt.nativeEvent.touches;

                // Pinch zoom
                if (touches.length === 2) {
                    const dx = touches[0].pageX - touches[1].pageX;
                    const dy = touches[0].pageY - touches[1].pageY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (!distanceRef.current) {
                        distanceRef.current = distance;
                    } else {
                        const scaleFactor = distance / distanceRef.current;
                        const nextScale = Math.max(1, Math.min(lastScale.current * scaleFactor, 4));
                        pinchScale.setValue(nextScale / lastScale.current);
                    }
                } else if (touches.length === 1 && lastScale.current > 1) {
                    pan.setValue({ x: lastPan.current.x + gestureState.dx, y: lastPan.current.y + gestureState.dy });
                }
            },

            onPanResponderRelease: (evt, gestureState) => {
                baseScale.setValue(lastScale.current * pinchScale.__getValue());
                lastScale.current = Math.max(1, Math.min(lastScale.current * pinchScale.__getValue(), 4));
                pinchScale.setValue(1);
                distanceRef.current = null;
                const maxPanX = (width * (lastScale.current - 1)) / 2;
                const maxPanY = (height * 0.6 * (lastScale.current - 1)) / 2;

                let finalX = pan.x.__getValue();
                let finalY = pan.y.__getValue();
                if (lastScale.current === 1) {
                    finalX = 0;
                    finalY = 0;
                } else {
                    finalX = Math.max(-maxPanX, Math.min(finalX, maxPanX));
                    finalY = Math.max(-maxPanY, Math.min(finalY, maxPanY));
                }
                lastPan.current = { x: finalX, y: finalY };

                Animated.spring(pan, {
                    toValue: { x: finalX, y: finalY },
                    useNativeDriver: false,
                }).start();
            },

            onPanResponderTerminationRequest: () => false,
        })
    ).current;

    return (
        <View style={styles.container}>
            {loading && (
                <ActivityIndicator
                    size="small"
                    color="#3A61A8"
                    style={styles.loader}
                />
            )}
            <Animated.View
                style={[
                    styles.imageContainer,
                    {
                        transform: [
                            { scale: scale },
                            { translateX: pan.x },
                            { translateY: pan.y },
                        ],
                    },
                ]}
                {...panResponder.panHandlers}
            >
                <Image
                    source={{ uri: URI }}
                    style={[styles.image, style]}
                    resizeMode={ImageResize || 'contain'}
                    onLoadStart={() => setLoading(true)}
                    onLoad={() => setLoading(false)}
                    onError={(e) => {
                        console.warn('Image load failed', e.nativeEvent.error);
                        setLoading(false);
                    }}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loader: {
        position: 'absolute',
        zIndex: 10,
    },
    imageContainer: {
        width: width,
        height: height * 0.6,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
})