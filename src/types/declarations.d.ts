// Type declarations for third-party modules without TypeScript support

declare module 'react-native-vector-icons/MaterialIcons' {
    import { Component } from 'react';
    import { TextProps } from 'react-native';

    interface IconProps extends TextProps {
        name: string;
        size?: number;
        color?: string;
    }

    export default class MaterialIcons extends Component<IconProps> { }
}

declare module 'react-native-vector-icons/FontAwesome' {
    import { Component } from 'react';
    import { TextProps } from 'react-native';

    interface IconProps extends TextProps {
        name: string;
        size?: number;
        color?: string;
    }

    export default class FontAwesome extends Component<IconProps> { }
}

declare module '*.svg' {
    import * as React from 'react';
    import { SvgProps } from 'react-native-svg';

    const content: React.FC<SvgProps>;
    export default content;
}
